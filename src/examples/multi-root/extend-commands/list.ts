import {
    command,
    metadata,
    Command
} from '../../../';

@command({
    brief: 'listing installed packages.'

})
export default class extends Command {
    @metadata
    execute() {
        return `Guess what, [clime, villa, thenfail, ...].`;
    }
}
