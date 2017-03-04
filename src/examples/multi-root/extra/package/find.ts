import {
    command,
    param,
    Command
} from '../../../../';

@command({
    description: 'Find package information'
})
export default class extends Command {
    execute(
        @param({
            required: true,
            description: 'Pattern of package to find'
        })
        pattern: string
    ) { }
}
