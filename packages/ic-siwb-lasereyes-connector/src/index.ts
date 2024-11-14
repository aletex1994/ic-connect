/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Ed25519KeyIdentity } from '@dfinity/identity-secp256k1';

// import '@btckit/types';
import { _createActor, handleDelegation } from './baseConnection';
import { idlFactory as verifierIDL } from './idls/ic_siwb_provider.idl';
import type { SignedDelegation, _SERVICE as verifierService, LoginDetails } from './idls/ic_siwb_provider';
import { hasOwnProperty } from './utils';
// import { Principal } from '@dfinity/principal';
import { type ActorSubclass, SignIdentity } from '@dfinity/agent';
import { KEY_ICSTORAGE_DELEGATION, KEY_ICSTORAGE_KEY, _deleteStorage, storage } from './storage';

import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity, isDelegationValid } from '@dfinity/identity';
import { IC_SIWB_CANISTERID, IC_SIWB_CANISTERID_TESTNET } from './shared/constant';
import { Principal } from '@dfinity/principal';
import { LaserEyesClient } from '@omnisat/lasereyes-core';
// import { toHexString } from '@dfinity/candid';

export class SiwbConnector {
  constructor(private delegationIdentity: DelegationIdentity, private publicKey: string, private userAddress: string) {}

  static async connect(provider: LaserEyesClient, canisterId?: string): Promise<SiwbConnector> {
    let key: null | SignIdentity = null;

    const maybeIdentityStorage = await storage.get(KEY_ICSTORAGE_KEY);

    if (maybeIdentityStorage) {
      try {
        key = Ed25519KeyIdentity.fromJSON(maybeIdentityStorage) as unknown as SignIdentity;
      } catch (e) {
        // Ignore this, this means that the ICStorage value isn't a valid Ed25519KeyIdentity
        // serialization.
      }
    }

    let chain: null | DelegationChain = null;
    let delegationTargets: string[] = [];
    let delegationIdentityK: DelegationIdentity | undefined = undefined;

    if (key) {
      try {
        const chainStorage = await storage.get(KEY_ICSTORAGE_DELEGATION);

        if (chainStorage) {
          chain = DelegationChain.fromJSON(chainStorage);

          chain.delegations.forEach(signedDelegation => {
            const targets =
              signedDelegation.delegation.targets && signedDelegation.delegation.targets.length > 0 ? signedDelegation.delegation.targets : undefined;
            if (targets) {
              delegationTargets = [...new Set(delegationTargets.concat(targets.map(e => e.toText())))];
            }
          });
          // Verify that the delegation isn't expired.
          if (!isDelegationValid(chain)) {
            await _deleteStorage(storage);
            key = null;
          } else {
            delegationIdentityK = DelegationIdentity.fromDelegation(key, chain);
          }
        }
      } catch (e) {
        console.error(e);
        // If there was a problem loading the chain, delete the key.
        await _deleteStorage(storage);
        key = null;
      }
    }

    const sessionId = Ed25519KeyIdentity.generate();

    if (!key) {
      await storage.set(KEY_ICSTORAGE_KEY, JSON.stringify(sessionId));
    }

    const _network = await provider.getNetwork();

    let canister_id = canisterId;
    if (_network.toLowerCase().includes('test') || _network.toLowerCase().includes('sig')) {
      canister_id = canisterId ??= IC_SIWB_CANISTERID_TESTNET;
    }

    // sessionId save to localstorage
    const verifierActor = await _createActor<verifierService>(
      verifierIDL,
      canister_id ?? IC_SIWB_CANISTERID,
      delegationIdentityK ?? (sessionId as unknown as SignIdentity),
    );

    const accounts = (await provider?.requestAccounts()) as string[];
    if (accounts === undefined || accounts.length === 0) {
      throw new Error('No accounts found');
    } else {
      const currentAccount = accounts[0]!;
      const public_key = (await provider?.getPublicKey()) as string;

      if (delegationIdentityK === undefined) {
        const messageRes = await verifierActor.actor.siwb_prepare_login(currentAccount);
        let message: string;
        if (hasOwnProperty(messageRes, 'Ok')) {
          // console.log(`prepare success ${messageRes.Ok}`);
          message = messageRes.Ok as string;
        } else {
          throw new Error(messageRes['Err']);
        }
        // console.log(`message is ${message}`);
        const signature = (await provider?.signMessage(message)) as string;
        // console.log(`signature is ${signature}`);
        const { delegationIdentity, delegationChain } = await handleDelegationVerification(
          verifierActor.actor,
          currentAccount,
          sessionId as unknown as SignIdentity,
          public_key,
          signature,
        );
        delegationIdentityK = delegationIdentity;
        await storage.set(KEY_ICSTORAGE_DELEGATION, JSON.stringify(delegationChain));
      }

      // delegationChain save to localstorage
      return new SiwbConnector(delegationIdentityK, public_key, currentAccount);
    }
  }

  public static async disconnect() {
    await _deleteStorage(storage);
  }

  public static async hasStorage(): Promise<boolean> {
    return !!(await storage.get(KEY_ICSTORAGE_DELEGATION));
  }

  public getPrincipal(): Principal {
    return this.delegationIdentity.getPrincipal();
  }

  public getAddress(): string {
    return this.userAddress;
  }

  public static async getPrincialFromBitcoinAddress(address: string) {
    const verifierActor = await _createActor<verifierService>(verifierIDL, IC_SIWB_CANISTERID, undefined);
    const p = await verifierActor.actor.get_principal(address);
    if (hasOwnProperty(p, 'Ok')) {
      return p.Ok;
    } else {
      throw new Error(p.Err);
    }
  }

  public static async getDelegationIdentity() {
    let key: null | SignIdentity = null;

    const maybeIdentityStorage = await storage.get(KEY_ICSTORAGE_KEY);

    if (maybeIdentityStorage) {
      try {
        key = Ed25519KeyIdentity.fromJSON(maybeIdentityStorage) as unknown as SignIdentity;
      } catch (e) {
        // Ignore this, this means that the ICStorage value isn't a valid Ed25519KeyIdentity
        // serialization.
      }
    }

    let chain: null | DelegationChain = null;
    let delegationTargets: string[] = [];
    let delegationIdentityK: DelegationIdentity | undefined = undefined;

    if (key) {
      try {
        const chainStorage = await storage.get(KEY_ICSTORAGE_DELEGATION);

        if (chainStorage) {
          chain = DelegationChain.fromJSON(chainStorage);

          chain.delegations.forEach(signedDelegation => {
            const targets =
              signedDelegation.delegation.targets && signedDelegation.delegation.targets.length > 0 ? signedDelegation.delegation.targets : undefined;
            if (targets) {
              delegationTargets = [...new Set(delegationTargets.concat(targets.map(e => e.toText())))];
            }
          });
          // Verify that the delegation isn't expired.
          if (!isDelegationValid(chain)) {
            await _deleteStorage(storage);
            key = null;
          } else {
            delegationIdentityK = DelegationIdentity.fromDelegation(key, chain);
          }
        }
      } catch (e) {
        // If there was a problem loading the chain, delete the key.
        await _deleteStorage(storage);
        key = null;
      }
    }
    return delegationIdentityK;
  }
}

export async function handleDelegationVerification(
  actor: ActorSubclass<verifierService>,
  address: string,
  sessionId: SignIdentity,
  public_key: string,
  signature: string,
): Promise<{ delegationIdentity: DelegationIdentity; delegationChain: DelegationChain }> {
  const session_key = Array.from(new Uint8Array(sessionId.getPublicKey().toDer()));
  const result = await actor.siwb_login(signature, address, public_key, session_key, { ECDSA: null });

  // new SiwbConnector();
  // const result = verifyMessage(publicKey, sig, message);
  if (hasOwnProperty(result, 'Ok')) {
    const { expiration, user_canister_pubkey } = result.Ok as LoginDetails;

    const res = await actor.siwb_get_delegation(address, session_key, expiration);

    if (res && hasOwnProperty(res, 'Ok')) {
      const signed_delegation = res.Ok as SignedDelegation;
      const targets = signed_delegation.delegation.targets.length > 0 ? signed_delegation.delegation.targets[0] : undefined;
      const s = {
        delegation: {
          pubkey: Uint8Array.from(signed_delegation.delegation.pubkey),
          expiration: BigInt(signed_delegation.delegation.expiration),
          targets: targets && targets.length > 0 ? targets : undefined,
        },
        signature: Uint8Array.from(signed_delegation.signature),
        userKey: user_canister_pubkey,
        timestamp: expiration,
      };
      const delegationResult = {
        kind: 'success',
        delegations: [s],
        userPublicKey: Uint8Array.from(s.userKey),
      };
      // console.log(toHexString(Uint8Array.from(s.userKey)));
      return await handleDelegation(delegationResult, sessionId);
    } else {
      throw new Error('No signed delegation found');
    }
  } else {
    throw new Error(result.Err as string);
  }
}
