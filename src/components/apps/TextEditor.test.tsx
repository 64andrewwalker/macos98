// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TextEditor from './TextEditor';

afterEach(() => {
  cleanup();
});

describe('TextEditor', () => {
  const renderEditor = () => render(
    <TextEditor
      fileId="1"
      fileName="Test.txt"
      initialContent=""
      onSave={() => {}}
    />
  );

  it('updates status bar counts after successive inputs', () => {
    const { container } = renderEditor();
    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();

    expect(screen.getByText('Characters: 0')).toBeInTheDocument();

    editor!.innerText = 'Hi';
    fireEvent.input(editor!);
    expect(screen.getByText('Characters: 2')).toBeInTheDocument();

    editor!.innerText = 'Hello world';
    fireEvent.input(editor!);
    expect(screen.getByText('Characters: 11')).toBeInTheDocument();
  });
});
