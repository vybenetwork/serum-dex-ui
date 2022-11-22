import {
    BaseSignerWalletAdapter,
    scopePollingDetectionStrategy,
    SendTransactionOptions,
    WalletError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
} from '@solana/wallet-adapter-base';
import {
    Blockhash,
    Connection, Message,
    PublicKey, SIGNATURE_LENGTH_IN_BYTES,
    Transaction,
    TransactionInstruction,
    TransactionSignature
} from '@solana/web3.js';
import {v4 as uuidv4} from 'uuid';
import bs58 from 'bs58'

interface Connected {
    publicKey: PublicKey;
}

interface SendTransaction {
    identifier: string;
    signature: TransactionSignature;
}

interface SerializableSignaturePubkeyPair {
    signature: string;
    pubkey: string;
}

interface SignTransaction {
    identifier: string;
    signatures: SerializableSignaturePubkeyPair[];
    feePayer: string;
    recentBlockhash: Blockhash;
    instructions: SerializableInstruction[];
    message?: string
}

interface StrikeWalletMessage {
    type: 'connected' | 'sendTransaction' | 'signTransaction' | 'sendFinalTransaction';
    error?: string;
    connected?: Connected;
    sendTransaction?: SendTransaction;
    signTransaction?: SignTransaction;
}

interface PendingTransactions {
    [hash: string]: SendTransaction | SignTransaction | null
}

interface SerializableInstruction {
    data: string,
    accountMetas: {address: string, signer: boolean, writable: boolean}[],
    programId: string
}
const DEFAULT_SIGNATURE_BUFFER = Buffer.alloc(SIGNATURE_LENGTH_IN_BYTES).fill(0)

export const StrikeWalletName = 'Strike' as WalletName;

export class StrikeWalletAdapter extends BaseSignerWalletAdapter {
    name = StrikeWalletName;
    // url = 'https://wallet.strikeprotocols.com';
    url = 'http://localhost:3000';
    icon =
        'data:image/png;base64,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'

    private _connecting: boolean;
    private _wallet: Window | null;
    private _isConnected: boolean;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' ? WalletReadyState.Unsupported : WalletReadyState.Loadable;
    private _pendingTransactions: PendingTransactions
    private _timers: number[]

    constructor() {
        super();
        this._connecting = false;
        this._wallet = null;
        this._isConnected = false;
        this._publicKey = null;
        this._pendingTransactions = {}
        this._timers = []
        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (this._wallet) {
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }

        window.addEventListener("message", (e) => {
            this.handleWalletMessage(e.data as StrikeWalletMessage)
        })
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get connecting(): boolean {
        return this._connecting;
    }

    get connected(): boolean {
        return this._isConnected;
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    private handleWalletMessage = (data: StrikeWalletMessage) => {
        if (data.type == "connected") {
            this._connecting = false;
            if (data.error) {
                this.emit('error', new WalletError(data.error));
            } else {
                this._isConnected = true;
                if (data.connected?.publicKey) {
                    this._publicKey = new PublicKey(data.connected.publicKey);
                    this.emit('connect', this._publicKey);
                }
            }
        } else if (["sendTransaction", "sendFinalTransaction"].includes(data.type)) {
            const transactionIdentifier = data.sendTransaction?.identifier
            if (transactionIdentifier && transactionIdentifier in this._pendingTransactions) {
                if (data.error) {
                    this.emit('error', new WalletError(data.error));
                } else {
                    this._pendingTransactions[transactionIdentifier] = data.sendTransaction || null
                }
            } else {
                this.emit('error', new WalletError("Unrecognized transaction"));
            }
        } else if (data.type == "signTransaction") {
            const transactionIdentifier = data.signTransaction?.identifier
            if (transactionIdentifier && transactionIdentifier in this._pendingTransactions) {
                if (data.error) {
                    this.emit('error', new WalletError(data.error));
                } else {
                    this._pendingTransactions[transactionIdentifier] = data.signTransaction || null
                }
            }
        }
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (![WalletReadyState.Installed, WalletReadyState.Loadable].includes(this._readyState)) throw new WalletNotReadyError();

            this._connecting = true;
            const origin = encodeURIComponent(window.location.origin);
            const connectUrl = `${this.url}/connect?origin=${origin}`;
            this._wallet = window.open(connectUrl, `strike-wallet-${origin}`, "height=800,width=800,menubar=no,status=no,toolbar=no");
            this._timers.push(window.setInterval(() => {
                if (this._wallet?.closed) {
                    this.cleanup();
                    this.emit('disconnect');
                } else if (this._wallet) {
                    this._wallet.postMessage({type: 'heartbeat'}, this.url)
                }
            }, 100));
        } catch (error: any) {
            this._connecting = false;
            this.emit('error', error);
            throw error;
        }
    }

    private cleanup = () => {
        this._wallet = null;
        this._publicKey = null;
        this._pendingTransactions = {};
        this._isConnected = false;
        this._connecting = false;
        [...this._timers].forEach(t => this.clearTimer(t));
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            wallet.close();
        }
        this.cleanup();
        this.emit('disconnect');
    }

    private clearTimer = (timer: number) => {
        this._timers = this._timers.filter(t => t != timer)
        window.clearInterval(timer);
    }

    private instructionsToSerializableInstructions = (instructions: TransactionInstruction[]): SerializableInstruction[] => instructions.map(i => {
        return {
            'programId': i.programId.toBase58(),
            'accountMetas': i.keys.map(k => {
                return {
                    address: k.pubkey.toBase58(),
                    signer: k.isSigner,
                    writable: k.isWritable,
                }
            }),
            'data': window.btoa(String.fromCharCode(...i.data)),
        }
    })

    async sendTransaction(
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions,
    ): Promise<TransactionSignature> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            const transactionIdentifier = uuidv4()
            this._pendingTransactions[transactionIdentifier] = null;
            const signers = options ? options.signers : undefined;

            if (signers && signers!.length > 0) {
                return new Promise<TransactionSignature>((resolve, reject) => {
                    this.signOneTransaction(transaction, transactionIdentifier).then(walletTransaction => {
                        this._pendingTransactions[transactionIdentifier] = null
                        signers?.length && walletTransaction.partialSign(...signers);
                        wallet.postMessage({
                            type: "sendFinalTransaction", sendFinalTransaction: {
                                transactionIdentifier,
                                signaturePubkeyPairs: walletTransaction.signatures.filter(sp => sp.signature != null).map(sp => {
                                    return {
                                        'pubkey': sp.publicKey.toBase58(),
                                        'signature': sp.signature!.toString('base64')
                                    }
                                })
                            }
                        }, this.url);
                        const timer = window.setInterval(() => {
                            const pendingTransaction = this._pendingTransactions[transactionIdentifier] as SendTransaction
                            if (pendingTransaction != null) {
                                this.clearTimer(timer);
                                resolve(pendingTransaction.signature)
                            }
                        }, 100);
                        this._timers.push(timer)
                    }).catch((error) => {
                        this.emit('error', error);
                        reject(error)
                        throw error;
                    })
                })
            } else {
                const instructions = this.instructionsToSerializableInstructions(transaction.instructions)
                return new Promise<TransactionSignature>((resolve, reject) => {
                    wallet.postMessage({
                        type: "sendTransaction",
                        sendTransaction: { instructions, transactionIdentifier }
                    }, this.url);
                    const timer = window.setInterval(() => {
                        const pendingTransaction = this._pendingTransactions[transactionIdentifier] as SendTransaction
                        if (pendingTransaction != null) {
                            this.clearTimer(timer);
                            resolve(pendingTransaction.signature)
                        }
                    }, 100);
                    this._timers.push(timer)
                })
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    private buildTransaction(pendingTransaction: SignTransaction): Transaction {
        let message = Message.from(Buffer.from(Uint8Array.from(window.atob(pendingTransaction.message!), c => c.charCodeAt(0))))
        return Transaction.populate(
            message,
            Array.from({length: message.header.numRequiredSignatures}, (_v, i) => {
                let sigPubkeyPair = pendingTransaction.signatures.find(s => s.pubkey == message.accountKeys[i].toBase58())
                return bs58.encode(sigPubkeyPair
                    ? Buffer.from(Uint8Array.from(window.atob(sigPubkeyPair.signature), c => c.charCodeAt(0)))
                    : DEFAULT_SIGNATURE_BUFFER
                )
            })
        )
    }

    private signOneTransaction(transaction: Transaction, transactionIdentifier = uuidv4()): Promise<Transaction> {
        const wallet = this._wallet;
        if (!wallet) throw new WalletNotConnectedError();
        const instructions = this.instructionsToSerializableInstructions(transaction.instructions)
        this._pendingTransactions[transactionIdentifier] = null;
        return new Promise<Transaction>((resolve, reject) => {
            wallet.postMessage({type: "signTransaction", signTransaction: { instructions, transactionIdentifier }}, this.url);
            const timer = window.setInterval(() => {
                const pendingTransaction = this._pendingTransactions[transactionIdentifier] as SignTransaction
                if (pendingTransaction != null) {
                    this.clearTimer(timer)
                    resolve(this.buildTransaction(pendingTransaction))
                }
            }, 100);
            this._timers.push(timer)
        });
    }

    private verifyCanSignRequest(transaction: Transaction) {
        if (transaction.signatures.some(s => s.signature != null)) {
            throw new WalletError("Strike does not support this signing mode")
        }
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        this.verifyCanSignRequest(transaction)
        try {
            return this.signOneTransaction(transaction);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        transactions.forEach(transaction => {
            this.verifyCanSignRequest(transaction)
        })
        try {
            return Promise.all(transactions.map(transaction => {
                return this.signOneTransaction(transaction);
            }))
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }


}