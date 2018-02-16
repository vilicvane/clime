import {Command, command, param} from '../../../../..';

@command({
  description: 'Bar description',
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
        name,
      },
      undefined,
      2,
    );
  }
}
