// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('updates status bar counts after successive inputs', async () => {
    const { container } = renderEditor();
    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement | null;
    expect(editor).not.toBeNull();

    expect(screen.getByText('Characters: 0')).toBeInTheDocument();

    editor!.innerText = 'Hi';
    fireEvent.input(editor!);
    await expect(screen.findByText('Characters: 2')).resolves.toBeInTheDocument();

    editor!.innerText = 'Hello world';
    fireEvent.input(editor!);
    await expect(screen.findByText('Characters: 11')).resolves.toBeInTheDocument();
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
    await screen.findByText('Characters: 15');
    expect(editor.textContent).toBe('Bold and italic');
    expect(editor.innerHTML).toBe('Bold and italic');

    expect(await screen.findByText('Characters: 15')).toBeInTheDocument();
  });

  it('sanitizes scripts and inline handlers from initial content', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const maliciousContent = "<script>window.__xss = 'ran'; alert('boom')</script><div onclick=\"window.__clicked = true\">Click me</div>";

    render(
      <TextEditor
        fileId="3"
        fileName="Malicious.txt"
        initialContent={maliciousContent}
        onSave={() => {}}
      />
    );

    const editor = await screen.findByTestId('text-editor-content');
    expect(editor.textContent).toBe('Click me');
    expect((window as typeof window & { __xss?: string; __clicked?: boolean }).__xss).toBeUndefined();
    expect((window as typeof window & { __xss?: string; __clicked?: boolean }).__clicked).toBeUndefined();
    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
