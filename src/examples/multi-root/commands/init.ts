import {
    command,
    metadata,
    Command
} from '../../../';

@command({
    brief: 'Initialization a package.'

})
export default class extends Command {
    @metadata
    execute(
    ) {
        return `...`;
    }
}
