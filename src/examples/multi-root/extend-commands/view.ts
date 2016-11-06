import {
    command,
    param,
    Command
} from '../../../';

@command({
    brief: '[extend] View package information.'

})
export default class extends Command {
    execute(
        @param({
            required: true,
            description: 'Name of package to view.'
        })
        name: string
    ) {
        return `Guess what, try extend-command \`npm view ${name}\`.`;
    }
}
