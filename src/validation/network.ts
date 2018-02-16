import {ExpectedError, ValidatorFunction} from '../core';

import * as Net from 'net';

export const ip: ValidatorFunction<string> = (value, {name}) => {
  if (!Net.isIP(value)) {
    throw new ExpectedError(
      `Value (${value}) of "${name}" is not a valid IP address`,
    );
  }
};

export const ipv4: ValidatorFunction<string> = (value, {name}) => {
  if (!Net.isIPv4(value)) {
    throw new ExpectedError(
      `Value (${value}) of "${name}" is not a valid IPv4 address`,
    );
  }
};

export const ipv6: ValidatorFunction<string> = (value, {name}) => {
  if (!Net.isIPv6(value)) {
    throw new ExpectedError(
      `Value (${value}) of "${name}" is not a valid IPv6 address`,
    );
  }
};
