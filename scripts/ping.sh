#!/bin/bash
cat << "EOF"
====================================
#                                  #
#        IBIS: PING TEST           #
#                                  #
====================================
EOF


version="4"
from= "[cont_ibis, 30304, 30303]"
to= "[cont_eth_1, 30304, 30303]"
expiration="1635957405"

printf "[$version, $from, $to, $expiration]"