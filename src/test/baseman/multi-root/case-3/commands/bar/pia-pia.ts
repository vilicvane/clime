import {Command, Options, command, metadata, option} from '../../../../../..';

export class PiaPiaOptions extends Options {
  @option({
    description: 'Useless name',
    flag: 'n',
  })
  name: string;

  @option({
    description: 'Useless switch',
    flag: 's',
    toggle: true,
  })
  switch: boolean;
}

@command({
  brief: 'Pia',
  description: 'Pia pia description',
})
export default class extends Command {
  @metadata
  execute(options: PiaPiaOptions) {
    return JSON.stringify(options, undefined, 2);
  }
}
