import * as Path from 'path';

import {CastingContext} from '../..';

import {Directory, File} from '../../castable/fs';

const SAMPLE_FILES_DIR = Path.join(__dirname, '../../../test/sample-files');
const FILE_BASE_NAME = 'file';
const TEXT_FILE_NAME = 'file.txt';
const JSON_FILE_NAME = 'file.json';
const NON_EXISTENT_NAME = 'guess-what';
const FILE_BASE_PATH = Path.join(SAMPLE_FILES_DIR, FILE_BASE_NAME);
const TEXT_FILE_PATH = Path.join(SAMPLE_FILES_DIR, TEXT_FILE_NAME);
const JSON_FILE_PATH = Path.join(SAMPLE_FILES_DIR, JSON_FILE_NAME);
const NON_EXISTENT_PATH = Path.join(SAMPLE_FILES_DIR, NON_EXISTENT_NAME);

const context: CastingContext<any> = {
  name: 'test',
  commands: ['clime'],
  cwd: SAMPLE_FILES_DIR,
  validators: [],
  default: false,
};

describe('Castable object `File`', () => {
  let textFile = File.cast(TEXT_FILE_PATH, context);
  let jsonFile = File.cast(JSON_FILE_PATH, context);

  it('should assert existence', async () => {
    await textFile.assert();
    await textFile.assert(true);
    await jsonFile.assert(false).should.be.rejectedWith('already exists');

    await File.cast(NON_EXISTENT_NAME, context).assert(false);
    await File.cast(NON_EXISTENT_PATH, context)
      .assert()
      .should.be.rejectedWith('does not exist');
    await File.cast(SAMPLE_FILES_DIR, context)
      .assert()
      .should.be.rejectedWith('expected to be a file');
  });

  it('should test existence', async () => {
    await textFile.exists().should.eventually.be.true;

    await File.cast(FILE_BASE_PATH, context)
      .exists(['.txt'])
      .should.eventually.equal(TEXT_FILE_PATH);

    await File.cast(FILE_BASE_PATH, context)
      .exists(['.js', '.txt'])
      .should.eventually.equal(TEXT_FILE_PATH);

    await File.cast(FILE_BASE_PATH, context).exists(['.js']).should.eventually
      .be.undefined;

    await File.cast(NON_EXISTENT_PATH, context).exists().should.eventually.be
      .false;
    await File.cast(SAMPLE_FILES_DIR, context).exists().should.eventually.be
      .false;
  });

  it('should read buffer', async () => {
    let buffer = await textFile.buffer();
    buffer.should.be.instanceOf(Buffer);
    buffer.toString('utf-8').should.equal('content\n');
  });

  it('should read text', async () => {
    (await textFile.text('ascii')).should.equal('content\n');
    (await textFile.text()).should.equal('content\n');
  });

  it('should read json', async () => {
    (await jsonFile.json<object>()).should.deep.equal({key: 'value'});
  });

  it('should require', () => {
    jsonFile.require<object>().should.deep.equal({key: 'value'});
  });
});

describe('Castable object `Directory`', () => {
  it('should assert existence', async () => {
    await Directory.cast(SAMPLE_FILES_DIR, context).assert();
    await Directory.cast('.', context).assert(true);
    await Directory.cast(NON_EXISTENT_NAME, context).assert(false);
    await Directory.cast(SAMPLE_FILES_DIR, context)
      .assert(false)
      .should.be.rejectedWith('already exists');
    await Directory.cast(NON_EXISTENT_PATH, context)
      .assert()
      .should.be.rejectedWith('does not exist');
    await Directory.cast(TEXT_FILE_NAME, context)
      .assert()
      .should.be.rejectedWith('expected to be a directory');
  });

  it('should test existence', async () => {
    await Directory.cast(SAMPLE_FILES_DIR, context).exists().should.eventually
      .be.true;
    await Directory.cast(NON_EXISTENT_PATH, context).exists().should.eventually
      .be.false;
    await Directory.cast(TEXT_FILE_NAME, context).exists().should.eventually.be
      .false;
  });
});
