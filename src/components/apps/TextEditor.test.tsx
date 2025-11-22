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

  it('renders saved rich content without escaping HTML and keeps stats from text', async () => {
    const richContent = '<b>Bold</b> and <i>italic</i>';
    render(
      <TextEditor
        fileId="2"
        fileName="Rich.txt"
        initialContent={richContent}
        onSave={() => {}}
      />
    );

    const editor = screen.getByTestId('text-editor-content');
    expect(editor.innerHTML.toLowerCase()).toContain('<b>bold</b>');
    expect(editor.innerHTML.toLowerCase()).toContain('<i>italic</i>');
    expect(editor.textContent).toBe('Bold and italic');

    expect(await screen.findByText('Characters: 15')).toBeInTheDocument();
  });
});
