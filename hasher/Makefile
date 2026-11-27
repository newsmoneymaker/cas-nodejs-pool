# mxhash: share validation helper for Cascoin (CAS)'s MinotaurX PoW.
#
# minotaurx-src/ is a copy of poolpayminer's own MinotaurX implementation (src/crypto/minotaurx/
# + the ghostrider sph_* primitives + yespower core it links against there) -- NOT re-derived, copied
# verbatim so this helper computes bit-for-bit the same hash the miner itself does. See
# minotaurx-src/minotaurx/minotaurx.cpp's own header comment for the algorithm and provenance.
#
# md_helper.c and aes_helper.c are #include'd INLINE by sph_sha2.c/sph_whirlpool.c/sph_echo.c/
# sph_shavite.c -- do not pass them to the compiler separately (duplicate-symbol link errors).
# yespower-platform.c is likewise #include'd inline by yespower-opt.c.
CC ?= gcc
CXX ?= g++
STATIC ?=

GR = minotaurx-src/ghostrider
YP = minotaurx-src/yespower
MX = minotaurx-src/minotaurx

C_SRCS = $(GR)/sph_blake.c $(GR)/sph_bmw.c $(GR)/sph_cubehash.c $(GR)/sph_echo.c $(GR)/sph_fugue.c \
         $(GR)/sph_groestl.c $(GR)/sph_hamsi.c $(GR)/sph_hamsi_helper.c $(GR)/sph_jh.c $(GR)/sph_keccak.c \
         $(GR)/sph_luffa.c $(GR)/sph_shabal.c $(GR)/sph_shavite.c $(GR)/sph_simd.c $(GR)/sph_skein.c \
         $(GR)/sph_whirlpool.c $(YP)/yespower-opt.c $(YP)/sha256.c
C_OBJS = $(C_SRCS:.c=.o)

mxhash: mxhash.cpp $(MX)/minotaurx.cpp $(C_OBJS)
	$(CXX) -O2 -std=c++11 -fomit-frame-pointer $(STATIC) -o $@ mxhash.cpp $(MX)/minotaurx.cpp $(C_OBJS) -I. -I$(MX) -I$(GR) -I$(YP) -lcrypto

%.o: %.c
	$(CC) -O2 -fomit-frame-pointer -I$(GR) -I$(YP) -c $< -o $@

clean:
	rm -f mxhash $(C_OBJS)
