#!/usr/bin/python
# -*- coding: utf-8 -*-

import requests

def erp_process_message_from_req_queue():
    resp = requests.get('https://aitsgqueues.mrteera.com/messages/erp_request')
    message_from_req = resp.json()

    if ('{}' == str(message_from_req)):
        print('No message in the queue: ' + str(message_from_req))
    else:
        print('Found a message in the queue: ' + str(message_from_req))
        message_id = message_from_req['id']
        resp = requests.delete('https://aitsgqueues.mrteera.com/messages/erp_request/{}'.format(message_id))
        print('status: ' + str(resp.status_code))

def erp_put_message_back_into_resp_queue():
    payload = { "qname": "erp_response",
                "message": "{\r\n\t\"gid\": \"g11543\",\r\n\t\"name\": \"Somchai\",\r\n\t\"auth\": \"true\"\r\n}"
    }
    resp = requests.post('https://aitsgqueues.mrteera.com/messages/erp_response', payload)

if __name__ == '__main__':
    erp_process_message_from_req_queue()
    erp_put_message_back_into_resp_queue()
