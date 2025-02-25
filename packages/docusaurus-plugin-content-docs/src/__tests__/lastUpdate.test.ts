/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import path from 'path';
import shell from 'shelljs';

import {getFileLastUpdate} from '../lastUpdate';

describe('lastUpdate', () => {
  const existingFilePath = path.join(
    __dirname,
    '__fixtures__/simple-site/docs/hello.md',
  );
  test('existing test file in repository with Git timestamp', async () => {
    const lastUpdateData = await getFileLastUpdate(existingFilePath);
    expect(lastUpdateData).not.toBeNull();

    const {author, timestamp} = lastUpdateData;
    expect(author).not.toBeNull();
    expect(typeof author).toBe('string');

    expect(timestamp).not.toBeNull();
    expect(typeof timestamp).toBe('number');
  });

  test('existing test file with spaces in path', async () => {
    const filePathWithSpace = path.join(
      __dirname,
      '__fixtures__/simple-site/docs/doc with space.md',
    );
    const lastUpdateData = await getFileLastUpdate(filePathWithSpace);
    expect(lastUpdateData).not.toBeNull();

    const {author, timestamp} = lastUpdateData;
    expect(author).not.toBeNull();
    expect(typeof author).toBe('string');

    expect(timestamp).not.toBeNull();
    expect(typeof timestamp).toBe('number');
  });

  test('non-existing file', async () => {
    const consoleMock = jest.spyOn(console, 'error').mockImplementation();
    const nonExistingFileName = '.nonExisting';
    const nonExistingFilePath = path.join(
      __dirname,
      '__fixtures__',
      nonExistingFileName,
    );
    await expect(getFileLastUpdate(nonExistingFilePath)).resolves.toBeNull();
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenLastCalledWith(
      expect.stringMatching(/because the file does not exist./),
    );
    await expect(getFileLastUpdate(null)).resolves.toBeNull();
    await expect(getFileLastUpdate(undefined)).resolves.toBeNull();
    consoleMock.mockRestore();
  });

  test('temporary created file that has no git timestamp', async () => {
    const tempFilePath = path.join(__dirname, '__fixtures__', '.temp');
    await fs.writeFile(tempFilePath, 'Lorem ipsum :)');
    await expect(getFileLastUpdate(tempFilePath)).resolves.toBeNull();
    await fs.unlink(tempFilePath);
  });

  test('Git does not exist', async () => {
    const mock = jest.spyOn(shell, 'which').mockImplementationOnce(() => null);
    const consoleMock = jest.spyOn(console, 'warn').mockImplementation();
    const lastUpdateData = await getFileLastUpdate(existingFilePath);
    expect(lastUpdateData).toBeNull();
    expect(consoleMock).toHaveBeenLastCalledWith(
      expect.stringMatching(
        /.*\[WARNING\].* Sorry, the docs plugin last update options require Git\..*/,
      ),
    );

    consoleMock.mockRestore();
    mock.mockRestore();
  });
});
