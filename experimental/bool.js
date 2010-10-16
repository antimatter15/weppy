/* Encoder first */
typedef struct {
    uint8 * output; /* ptr to next byte to be written */
    uint32 range; /* 128 <= range <= 255 */
    uint32 bottom; /* minimum value of remaining output */
    int bit_count; /* # of shifts before an output byte is available */
}
bool_encoder; /* Must set initial state of encoder before writing any bools. */
void init_bool_encoder(bool_encoder * e, uint8 * start_partition) {
    e - > output = start_partition;
    e - > range = 255;
    e - > bottom = 0;
    e - > bit_count = 24;
}
/* Encoding very rarely produces a carry that must be propagated to
the already-written output. The arithmetic guarantees that the propagation
will never go beyond the beginning of the output. Put another way, the
encoded value x is always less than one. */
void add_one_to_output(uint8 * q) {
    while ( * --q == 255) * q = 0;
    ++ * q;
}
/* Main function writes a bool_value whose probability of being zero is
(expected to be) prob/256. */
void write_bool(bool_encoder * e, Prob prob, int bool_value) {
/* split is approximately (range * prob) / 256  and, crucially,
VP8 Data Format and Decoding Guide Chapter 7: Boolean Entropy Decoder
WebM Project Page 20 of 104is strictly bigger than zero and strictly smaller than range */
    uint32 split = 1 + (((e - > range - 1) * prob) >> 8);
    if (bool_value) {
        e - > bottom += split; /* move up bottom of interval */
        e - > range -= split; /* with corresponding decrease in range */
    } else e - > range = split; /* decrease range, leaving bottom alone */
    while (e - > range < 128) {
        e - > range <<= 1;
        if (e - > bottom & (1 << 31)) /* detect carry */
        add_one_to_output(e - > output);
        e - > bottom <<= 1; /* before shifting bottom */
        if (!--e - > bit_count) { /* write out high byte of bottom ... */
            * e - > output++ = (uint8)(e - > bottom >> 24);
            e - > bottom &= (1 << 24) - 1; /* ... keeping low 3 bytes */
            e - > bit_count = 8; /* 8 shifts until next output */
        }
    }
}
/* Call this function (exactly once) after encoding the last bool value
for the partition being written */
void flush_bool_encoder(bool_encoder * e) {
    int c = e - > bit_count;
    uint32 v = e - > bottom;
    if (v & (1 << (32 - c))) /* propagate (unlikely) carry */
    add_one_to_output(e - > output);
    v <<= c & 7; /* before shifting remaining output */
    c >>= 3; /* to top of internal buffer */
    while (--c >= 0)
    v <<= 8;
    c = 4;
    while (--c >= 0) { /* write remaining data, possibly padded */
        * e - > output++ = (uint8)(v >> 24);
        v <<= 8;
    }
}
/* Decoder state exactly parallels that of the encoder.
"value", together with the remaining input, equals the complete encoded
number x less the left endpoint of the current coding interval. */
typedef struct {
    uint8 * input; /* pointer to next compressed data byte */
    uint32 range; /* always identical to encoder's range */
    uint32 value; /* contains at least 24 significant bits */
    int bit_count; /* # of bits shifted out of value, at most 7 */
}
bool_decoder; /* Call this function before reading any bools from the partition.*/
void init_bool_decoder(bool_decoder * d, uint8 * start_partition) {
    {
        int i = 0;
        d - > value = 0; /* value = first 24 input bytes */
        while (++i <= 24)
        d - > value = (d - > value << 8) | * start_partition++;
    }
    d - > input = start_partition; /* ptr to next byte to be read */
    d - > range = 255; /* initial range is full */
    d - > bit_count = 0; /* have not yet shifted out any bits */
}
/* Main function reads a bool encoded at probability prob/256, which of
course must agree with the probability used when the bool was written. */
int read_bool(bool_decoder * d, Prob prob) {
/* range and split are identical to the corresponding values used
by the encoder when this bool was written */
    uint32 split = 1 + (((d - > range - 1) * prob) >> 8);
    uint32 SPLIT = split << 8;
    int retval; /* will be 0 or 1 */
    if (d - > value >= SPLIT) { /* encoded a one */
        retval = 1;
        d - > range -= split; /* reduce range */
        d - > value -= SPLIT; /* subtract off left endpoint of interval */
    } else { /* encoded a zero */
        retval = 0;
        d - > range = split; /* reduce range, no change in left endpoint */
    }
    while (d - > range < 128) { /* shift out irrelevant value bits */
        d - > value <<= 1;
        d - > range <<= 1;
        if (++d - > bit_count == 8) { /* shift in new bits 8 at a time */
            d - > bit_count = 0;
            d - > value |= * d - > input++;
        }
    }
    return retval;
}
/* Convenience function reads a "literal", that is, a "num_bits" wide
unsigned value whose bits come high- to low-order, with each bit
encoded at probability 128 (i.e., 1/2). */
uint32 read_literal(bool_decoder * d, int num_bits) {
    uint32 v = 0;
    while (num_bits--)
    v = (v << 1) + read_bool(d, 128);
    return v;
} /* Variant reads a signed number */
int32 read_signed_literal(bool_decoder * d, int num_bits) {
    int32 v = 0;
    if (!num_bits) VP8 Data Format and Decoding Guide Chapter 7: Boolean Entropy Decoder WebM Project Page 22 of 104return 0;
    if (read_bool(d, 128)) v = -1;
    while (--num_bits)
    v = (v << 1) + read_bool(d, 128);
    return v;
}
