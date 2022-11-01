import React from 'react';
import { toast } from 'react-toastify';

export const MESSAGE = {
  VAULT_CREATE: {
    SUCCESS: '',
    ERROR: ''
  },
  SUPERVISOR_CREATE: {
    SUCCESS: '',
    ERROR: ''
  },
  VAULTSTRATEGY: {
    SUCCESS: 'Strategy created on vault.',
    ERROR: ''
  },
  TRADE: {
    SUCCESS: '',
    ERROR: ''
  },
  CLOSEROUND: {
    SUCCESS: '',
    ERROR: ''
  },
  STARTROUND: {
    SUCCESS: 'Round started.',
    ERROR: 'Failed to start round.'
  },
  TRADE: {
    SUCCESS: '',
    ERROR: ''
  },
  SETVAULT: {
    SUCCESS: '',
    ERROR: ''
  },
  DEPOSIT: {
    SUCCESS: '',
    ERROR: ''
  },
  WITHDRAWAL: {
    SUCCESS: '',
    ERROR: ''
  }
}

export const TYPE = {
  ERROR: 'ERROR', 
  SUCCESS: 'SUCCESS'
}

export const Notifier = (message, type, _toastId) => {

  if(type == TYPE.SUCCESS) {

    toast.success(message, {
      position: "top-right",
    });

  }

  if(type == TYPE.ERROR) {
    toast.error(message, {
      position: "top-right",
    });
  }

}
