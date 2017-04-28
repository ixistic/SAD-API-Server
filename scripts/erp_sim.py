#!/usr/bin/python
# -*- coding: utf-8 -*-

import requests
# import simplejson as json
import json

def erp_process_message_from_req_queue():
    resp = requests.get('https://aitsgqueues.mrteera.com/messages/erp_request')
    message_from_req = resp.json()

    if ('{}' == str(message_from_req)):
        print('No message in the queue: ' + str(message_from_req))
        return None
    else:
        print('Found a message in the queue: ' + str(message_from_req))
        message_id = message_from_req['id']
        return message_from_req['message'], message_id

def erp_put_message_back_into_resp_queue(message, message_id):
    if message == None:
        return None
    message = json.loads(message.encode('utf-8').replace("'", '"'))
    resp_msg = "{\r\n\t\"gid\": \"%s\"" % message['username']
    resp_msg += ",\r\n\t\"name\": \"noname\""
    resp_msg += ",\r\n\t\"auth\": \"true\""
    resp_msg += ",\r\n\t\"device_token\": \"%s\"\r\n}" % message['device-token']
    payload = { "qname": "erp_response",
		"message": resp_msg
    }
    resp = requests.post('https://aitsgqueues.mrteera.com/messages/erp_response', payload)
    print("erp_response status coode: " + str(resp.status_code))
    if resp.status_code == 200:
        resp = requests.delete('https://aitsgqueues.mrteera.com/messages/erp_request/{}'.format(message_id))
        print('delete message status: ' + str(resp.status_code))

if __name__ == '__main__':
    message, message_id = erp_process_message_from_req_queue()
    erp_put_message_back_into_resp_queue(message, message_id)
