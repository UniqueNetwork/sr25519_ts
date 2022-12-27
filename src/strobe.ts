import * as sha3 from '@noble/hashes/sha3'
import * as sha3Addons from '@noble/hashes/sha3-addons'
//import * as keccak_f1800 from './keccak'
import * as hashFunc from './keccakf1600'

/// <summary>
/// Srobe operation
/// </summary>
export enum Operation
{
    /// <summary>
    /// AD operation
    /// </summary>
    Ad,

    /// <summary>
    /// Key operation
    /// </summary>
    Key,

    /// <summary>
    /// PRF operation
    /// </summary>
    Prf,

    /// <summary>
    /// Send cleartext operation
    /// </summary>
    SendClr,

    /// <summary>
    /// Receive cleartext operation
    /// </summary>
    RecvClr,

    /// <summary>
    /// Send encrypted operation
    /// </summary>
    SendEnc,

    /// <summary>
    /// Receive encrepted operation
    /// </summary>
    RecvEnc,

    /// <summary>
    /// Send MAC operation
    /// </summary>
    SendMac,

    /// <summary> 
    /// Receive MAC operation
    /// </summary>
    RecvMac,

    /// <summary>
    /// Ratchet (rekey) operation
    /// </summary>
    Ratchet,
}


export enum Flag
{
    FlagI = 1,

    FlagA = 2,

    FlagC = 4,

    FlagT = 8,

    FlagM = 16,

    FlagK = 32
}

enum Role
{
    /// <summary>
    /// Set if we send the first transport message
    /// </summary>
    Initiator = 0,

    /// <summary>
    /// Set if we receive the first transport message
    /// </summary>
    Responder = 1,

    /// <summary>
    /// starting value
    /// </summary>
    None = 2
}

export let operationMap = new Map<Operation, Flag>();

const CAPACITY_BITS = 128;
 const PAD_BYTES = 2;
 const RATE_INNER =  ((25*32-CAPACITY_BITS/8));
 const RATE = RATE_INNER-PAD_BYTES;


export class Strobe{
    public state: Uint8Array;
    public initialized: boolean;
    public pos: number;
    public posBegin: number;
    public strobeR: number;
    public curFlags: Flag;
    public i0: Role;

    /// <summary>
    /// The size of the authentication tag used in AEAD functions
    /// </summary>
    private MacLen = 16;

    

    strobe_init (
      description: string,
      //desclen: number
      ) {

        operationMap.set(Operation.Ad, Flag.FlagA);
        operationMap.set(Operation.Key, Flag.FlagA | Flag.FlagC);
        operationMap.set(Operation.Prf, Flag.FlagI | Flag.FlagA | Flag.FlagC);
        operationMap.set(Operation.SendClr, Flag.FlagA | Flag.FlagT);
        operationMap.set(Operation.RecvClr, Flag.FlagI | Flag.FlagA | Flag.FlagT);
        operationMap.set(Operation.SendEnc, Flag.FlagA | Flag.FlagC | Flag.FlagT);
        operationMap.set(Operation.RecvEnc, Flag.FlagI | Flag.FlagA | Flag.FlagC | Flag.FlagT);
        operationMap.set(Operation.SendMac, Flag.FlagC | Flag.FlagT);
        operationMap.set(Operation.RecvMac, Flag.FlagI | Flag.FlagC | Flag.FlagT);
        operationMap.set(Operation.Ratchet, Flag.FlagC);

        // /// <summary>
        // /// Operation - flag map
        // /// </summary>
        // enum operationMap
        // {
        //     { Operation.RecvMac, Flag.FlagI | Flag.FlagC | Flag.FlagT },
        //     { Operation.Ratchet, Flag.FlagC }
        // };


        this.initialized = false;
        let duplexRate = 1600 / 8 - 128 / 4;
        this.strobeR = duplexRate - 2;

        let f: Uint8Array = Uint8Array.from([
            1,this.strobeR + 2,
            1,0, /* Empty NIST perso string */
            1,12*8, /* 12 = strlen("STROBEvX.Y.Z") */
            // 'S'.charCodeAt(0),'T'.charCodeAt(0),'R'.charCodeAt(0),'O'.charCodeAt(0),'B'.charCodeAt(0),'E'.charCodeAt(0),
            // 'v'.charCodeAt(0),
            // '0'.charCodeAt(0)+STROBE_INTEROP_V_MAJOR,'.'.charCodeAt(0),
            // '0'.charCodeAt(0)+STROBE_INTEROP_V_MINOR,'.'.charCodeAt(0),
            // '0'.charCodeAt(0)+STROBE_INTEROP_V_PATCH,
        ]);

        
        let s = new TextEncoder().encode("STROBEv1.0.2");
        var first = new Uint8Array(f.length + s.length);

        first.set(f);
        first.set(s, f.length);


        // keccak_f800
        // this.state = sha3.keccak_224(proto);

        this.posBegin = 0;
        this.pos = 0;
        this.state = new Uint8Array(200);

        // f[0] = FLAG_A|FLAG_M;
        this.strobe_duplex(first, 0, first.byteLength, false, false, true);

        this.initialized = true;
       // var operateBytes: Uint8Array = new Uint8Array(description.length);
        
        const operateBytes = Buffer.from(description, 'ascii');


        this.operate(true, operationMap.get(Operation.Ad) as Flag, operateBytes, 0, operateBytes.length, 0, false);
    }


    clone(): Strobe {
        let s = new Strobe();
        s.state = Uint8Array.from(this.state);
        s.initialized = this.initialized;
        s.pos = this.pos;
        s.posBegin = this.posBegin;
        s.strobeR = this.strobeR;
        s.curFlags = this.curFlags;
        s.i0 = this.i0;
        
        return s;
    }

    /* Mark current position and state, and run F.
    * Should be compatible with CSHAKE.
    */
    run_f () {

        if (this.initialized)
        {
            this.state[this.pos] ^= this.posBegin;
            this.state[this.pos + 1] ^= 4;
            this.state[this.strobeR + 1] ^= 128;
        }
 
    
        this.state = hashFunc.Keccak.KeccakF1600(this.state, 24);
        
        // Keccak.KeccakF1600(ref state, 24);
        this.posBegin = 0;
        this.pos = 0;// (posBegin = 0);
    }

    /* Place a "mark" in the hash, which is distinct from the effect of writing any byte
    * into the hash.  Then write the new mode into the hash.
    */
    strobe_mark(pptr: Uint8Array, flags: any) {

    }
        
    /* The core duplex mode */
    strobe_duplex (data: Uint8Array, startIndex: number, count: number, cbefore: boolean, cafter: boolean, forceF: boolean) {

        // Copy data
       let newData = data.slice(startIndex, count);

        for (var i = 0; i < newData.byteLength; i++)
        {
            // Process data block by block
            if (cbefore)
            {
                newData[i] ^= this.state[this.pos];
            }

            this.state[this.pos] ^= newData[i];
            if (cafter)
            {
                newData[i] = this.state[this.pos];
            }

            this.pos += 1;
            if (this.pos == this.strobeR)
            {
                this.run_f();
            }
        }

        // sometimes we the next operation to start on a new block
        if (forceF && this.pos != 0)
        {
            this.run_f();
        }

        return newData;
    }

    /// <summary>
    /// Operate runs an operation
    /// For operations that only require a length, provide the length via the
    /// length argument. For other operations provide a zero length.
    /// Result is always retrieved through the return value. For boolean results,
    /// check that the first index is 0 for true, 1 for false.
    /// </summary>
    operate(
        meta: boolean,
        flags: Flag,
        dataConst: Uint8Array,
        starIndex: number,
        count: number,
        length: number,
        more: boolean): Uint8Array | null
    {
        // operation is valid?
        // if (!this.operationMap.TryGetValue(operation, out var flags))
        // {
        //     throw new Exception($"Not a valid operation: [{operation}]");
        // }

        // operation is meta?
        if (meta)
        {
            flags |= Flag.FlagM;
        }

        // does the operation requires a length?
        let data: Uint8Array;

        if ((flags & (Flag.FlagI | Flag.FlagT)) != (Flag.FlagI | Flag.FlagT)
            && (flags & (Flag.FlagI | Flag.FlagA)) != Flag.FlagA)
        {
            if (length == 0)
            {
               // throw new Exception("A length should be set for this operation");
            }

            data = new Uint8Array(length);
        }
        else
        {
            if (length != 0)
            {
                //throw new Exception("Output length must be zero except for PRF, SendMac and RATCHET operations");
            }

            data = dataConst;
        }

        if (more)
        {
            if (flags != this.curFlags)
            {
                //throw new Exception("Flag should be the same when streaming operations");
            }
        }
        else
        {
            this.begin_op(flags);
            this.curFlags = flags;
        }

        // Operation

        var cAfter = (flags & (Flag.FlagC | Flag.FlagI | Flag.FlagT)) == (Flag.FlagC | Flag.FlagT);
        var cBefore = (flags & Flag.FlagC) != 0 && !cAfter;

        // length should be zero for prf only, already checked this before
        // if len!=0 then just use input count
        var processed = this.duplex(data, starIndex, length == 0 ? count : length, cBefore, cAfter, false);

        if ((flags & (Flag.FlagI | Flag.FlagA)) == (Flag.FlagI | Flag.FlagA))
        {
            return processed;
        }

        if ((flags & (Flag.FlagI | Flag.FlagT)) == Flag.FlagT)
        {
            // Return data for the transport.
            return processed;
        }

        if ((flags & (Flag.FlagI | Flag.FlagA | Flag.FlagT)) == (Flag.FlagI | Flag.FlagT))
        {
            // Check MAC: all output bytes must be 0
            if (more)
            {
                // throw new Exception("not supposed to check a MAC with the 'more' streaming option");
            }

            let failures = 0;
            processed.forEach(d => {
                failures |= d;
            });
            // foreach (var dataByte in processed) failures |= dataByte;

            return Uint8Array.from([failures]); // 0 if correct, 1 if not
        }

        // Operation has no output
        return null;
    }

    // beginOp: starts an operation
    begin_op(flags: Flag)
    {
        if ((flags & Flag.FlagT) != 0)
        {
            if (this.i0 == Role.None)
            {
                this.i0 = (flags & Flag.FlagI);
            }

            flags ^= this.i0;
        }

        let oldBegin = this.posBegin;
        this.posBegin = (this.pos + 1);
        let forceF = (flags & (Flag.FlagC | Flag.FlagK)) != 0;
        //let data = new[] { oldBegin, (byte)flags };

        let data: Uint8Array = new Uint8Array(2);
        data[0] = oldBegin % 255;
        data[1] = flags;

        this.duplex(data, 0, data.length, false, false, forceF);
    }


    duplex(data: Uint8Array, startIndex: number, count: number, cbefore: boolean, cafter: boolean, forceF: boolean): Uint8Array
    {
        if (cbefore && cafter)
        {
            //throw new Exception($"either {nameof(cbefore)} or {nameof(cafter)} should be set to false");
        }

        // Copy data
        var newData = data.slice();

        for (var i = 0; i < newData.length; i++)
        {
            // Process data block by block
            if (cbefore)
            {
                newData[i] ^= this.state[this.pos];
            }

            this.state[this.pos] ^= newData[i];
            if (cafter)
            {
                newData[i] = this.state[this.pos];
            }

            this.pos += 1;
            if (this.pos == this.strobeR)
            {
                this.run_f();
            }
        }

        // sometimes we the next operation to start on a new block
        if (forceF && this.pos != 0)
        {
            this.run_f();
        }

        return newData;
    }

        /// <summary>
        /// Authenticate Additional Data.
        /// Should be followed by a SendMAc or RecvMac in order to truly work
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="additionalData">
        /// Data to authenticate
        /// </param>
        ad(meta: boolean, additionalData: Uint8Array)
        {
            this.ad_f(meta, additionalData, 0, additionalData.length);
        }

        /// <summary>
        /// Authenticate Additional Data.
        /// Should be followed by a SendMAc or RecvMac in order to truly work
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="additionalData">
        /// Data to authenticate
        /// </param>
        /// <param name="startIndex">
        /// Start index for reading from buffer
        /// </param>
        /// <param name="count">
        /// Number of bytes to read
        /// </param>
        ad_f(meta: boolean, additionalData: Uint8Array, startIndex: number, count: number)
        {
            this.operate(meta, operationMap.get(Operation.Ad) as Flag, additionalData, startIndex, count, 0, false);
        }

                /// <summary>
        /// Send data in cleartext
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="cleartext">
        /// Cleartext to send
        /// </param>
        send_clr(meta: boolean, cleartext: Uint8Array): Uint8Array | null
        {
            return this.send_clr_f(meta, cleartext, 0, cleartext.length);
        }

        /// <summary>
        /// Send data in cleartext
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="cleartext">
        /// Cleartext to send
        /// </param>
        /// <param name="startIndex">
        /// Start index for reading from buffer
        /// </param>
        /// <param name="count">
        /// Number of bytes to read
        /// </param>
        send_clr_f(meta: boolean, cleartext: Uint8Array, startIndex: number, count: number): Uint8Array | null
        {
            return this.operate(meta, operationMap.get(Operation.SendClr) as Flag, cleartext, startIndex, count, 0, false);
        }

        /// <summary>
        /// Receive data in cleartext
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="cleartext">
        /// Cleartext to send
        /// </param>
        recv_clr(meta: boolean, cleartext: Uint8Array): Uint8Array | null
        {
            return this.recv_clr_f(meta, cleartext, 0, cleartext.length);
        }

        /// <summary>
        /// Receive data in cleartext
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="cleartext">
        /// Cleartext to send
        /// </param>
        /// <param name="startIdex">
        /// Start index for reading from buffer
        /// </param>
        /// <param name="count">
        /// Number of bytes to read
        /// </param>
        recv_clr_f(meta: boolean, cleartext: Uint8Array, startIdex: number, count: number): Uint8Array | null
        {
            
            return this.operate(meta, operationMap.get(Operation.RecvClr) as Flag, cleartext, startIdex, count, 0, false);
        }        

        /// <summary>
        /// Produce an authentication tag.
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="outputLength">
        /// Expected tag length
        /// </param>
        send_mac(meta: boolean, outputLength: number): Uint8Array | null
        {
            return this.operate(meta, operationMap.get(Operation.SendMac) as Flag, new Uint8Array(0), 0, 0, outputLength, false);
        }

                /// <summary>
        /// Verify a received authentication tag.
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="mac">
        /// Tag to verify
        /// </param>
        recv_mac(meta: boolean, mac: Uint8Array) : boolean
        {
            return this.recv_mac_f(meta, mac, 0, mac.length);
        }

        /// <summary>
        /// Verify a received authentication tag.
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="mac">
        /// Tag to verify
        /// </param>
        /// <param name="startIndex">
        /// Start index for reading from buffer
        /// </param>
        /// <param name="count">
        /// Number of bytes to read
        /// </param>
        recv_mac_f(meta: boolean, mac: Uint8Array, startIndex: number, count: number) : boolean
        {
            let r = this.operate(meta, operationMap.get(Operation.RecvMac) as Flag, mac, startIndex, count, 0, false);
            
            if (r == null) {
                return false;
            }

            return r[0] == 0;
        }

        /// <summary>
        /// Introduce forward secrecy in a protocol.
        /// </summary>
        /// <param name="length">
        /// Expected length
        /// </param>
        ratchet(length: number)
        {
            this.operate(false, operationMap.get(Operation.Ratchet) as Flag, new Uint8Array(0), 0, 0, length, false);
        }

                /// <summary>
        /// Encrypt plaintext.
        /// Should be followed by SendMac in order to protect its integrity
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="plaintext">
        /// Plaintext to be encrypted
        /// </param>
        send_enc_unauthenticated(meta: boolean, plaintext: Uint8Array): Uint8Array | null
        {
            return this.send_enc_unauthenticated_f(meta, plaintext, 0, plaintext.length);
        }

        /// <summary>
        /// Encrypt plaintext.
        /// Should be followed by SendMac in order to protect its integrity
        /// </summary>
        /// <param name="meta">
        /// Framing data.
        /// </param>
        /// <param name="plaintext">
        /// Plaintext to be encrypted
        /// </param>
        /// <param name="startIndex">
        /// Start index for reading from buffer
        /// </param>
        /// <param name="count">
        /// Number of bytes to read
        /// </param>
        send_enc_unauthenticated_f(meta: boolean, plaintext: Uint8Array, startIndex: number, count: number)
        {
            return this.operate(meta, operationMap.get(Operation.SendEnc) as Flag, plaintext, startIndex, count, 0, false);
        }

        /// <summary>
        /// Encrypt data and authenticate additional data
        /// </summary>
        /// <param name="plaintext">
        /// Data to be encrypted and authenticated
        /// </param>
        /// <param name="ad">
        /// Additional data to be authenticated
        /// </param>
        send_aead(plaintext: Uint8Array, ad: Uint8Array): Uint8Array | null
        {
            return this.send_aead_f(plaintext, 0, plaintext.length, ad, 0, ad.length);
        }

        /// <summary>
        /// Encrypt data and authenticate additional data
        /// </summary>
        /// <param name="plaintext">
        /// Data to be encrypted and authenticated
        /// </param>
        /// <param name="plaintextStartIndex">
        /// Start index for reading from plaintext buffer
        /// </param>
        /// <param name="plaintextCount">
        /// Number of plaintext bytes to read
        /// </param>
        /// <param name="ad">
        /// Additional data to be authenticated
        /// </param>
        /// <param name="adStartIndex">
        /// Start index for reading from AD buffer
        /// </param>
        /// <param name="adCOunt">
        /// Number of AD bytes to read
        /// </param>
        send_aead_f(
            plaintext: Uint8Array,
            plaintextStartIndex: number,
            plaintextCount: number,
            ad: Uint8Array,
            adStartIndex: number,
            adCOunt: number): Uint8Array | null
        {
            var ciphertext = this.send_enc_unauthenticated_f(false, plaintext, plaintextStartIndex, plaintextCount);
            this.ad_f(false, ad, adStartIndex, adCOunt);
            // TODO
            //ciphertext = ciphertext.Concat(this.send_mac(false, this.MacLen)).ToArray();
            return ciphertext;
        }

}



