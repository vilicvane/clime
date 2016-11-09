import {
    command,
    param,
    Command
} from '../../../';

@command({
    brief: 'View package information.'

})
export default class extends Command {
    execute(
        @param({
            required: true,
            description: 'Name of package to view.'
        })
        name: string
    ) {
        return `Guess what, try command \`npm view ${name}\`.`;
    }
}
