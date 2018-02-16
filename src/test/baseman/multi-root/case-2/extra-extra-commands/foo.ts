import {Command, command, param} from '../../../../..';

@command({
  brief: 'Extra extra foo brief',
  description: 'Extra extra foo description',
})
export default class extends Command {
  execute(
    @param({
      description: 'Some name',
    })
    name: string,
  ) {
    return JSON.stringify(
      {
        extraExtra: true,
        name,
      },
      undefined,
      2,
    );
  }
}
