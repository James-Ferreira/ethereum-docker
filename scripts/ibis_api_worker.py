#!/usr/bin/env python3
#
# Copyright (c) 2021 Oracle and/or its affiliates. All rights reserved.
#
import requests
import os
import json
from requests import api

def get_peers(api_info):

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "admin_peers",
        "params": []
    }

    res = requests.post(
        api_info["URL"] + ":" + api_info["PORT"],
        headers=api_info["HEADER"],
        data = json.dumps(payload)
    )

    if res.status_code != 200:
        print("ERROR: Status Code ($d) in get_peers", res.status_code)

    return res.json()

if __name__ == '__main__':

    # api configuration
    api_info = {
        "URL": "http://localhost",
        "PORT": "8545",
        "HEADER": {
            'Content-Type': 'application/json',
        },
    }

    api_test = get_peers(api_info)
    print(api_test)