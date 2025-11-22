import React, { useEffect, useRef, useState } from 'react';
import styles from './TextEditor.module.scss';

interface TextEditorProps {
    fileId: string;
    fileName: string;
    initialContent: string;
    onSave: (fileId: string, content: string) => void;
}

type FontFamily = 'Geneva' | 'Times' | 'Courier' | 'Helvetica';
type FontSize = 9 | 10 | 12 | 14 | 18 | 24;
type Alignment = 'left' | 'center' | 'right' | 'justify';

const sanitizeContent = (html: string) => {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style').forEach(node => node.remove());
    doc.querySelectorAll<HTMLElement>('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.toLowerCase().startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return doc.body.textContent ?? '';
};

const TextEditor: React.FC<TextEditorProps> = ({ fileId, fileName, initialContent, onSave }) => {
    const normalizedInitialContent = initialContent ?? '';
    const editorRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const [isDirty, setIsDirty] = useState(false);
    const [content, setContent] = useState(() => sanitizeContent(normalizedInitialContent));
    const [fontFamily, setFontFamily] = useState<FontFamily>('Geneva');
    const [fontSize, setFontSize] = useState<FontSize>(12);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [alignment, setAlignment] = useState<Alignment>('left');
    const [wordWrap, setWordWrap] = useState(true);
    const [showRuler, setShowRuler] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        if (editorRef.current) {
            editorRef.current.textContent = content;
        }
        initializedRef.current = true;
    }, [content]);

    const handleInput = () => {
        const text = editorRef.current?.innerText ?? '';
        setContent(text);
        setIsDirty(true);
    };

    const handleSave = () => {
        const textContent = editorRef.current?.innerText ?? '';
        setContent(textContent);
        onSave(fileId, textContent);
        setIsDirty(false);
    };

    const applyBold = () => {
        document.execCommand('bold');
        setIsBold(!isBold);
    };

    const applyItalic = () => {
        document.execCommand('italic');
        setIsItalic(!isItalic);
    };

    const applyUnderline = () => {
        document.execCommand('underline');
        setIsUnderline(!isUnderline);
    };

    const applyAlignment = (align: Alignment) => {
        const command = `justify${align.charAt(0).toUpperCase() + align.slice(1)}`;
        document.execCommand(command);
        setAlignment(align);
    };

    const changeFontFamily = (font: FontFamily) => {
        setFontFamily(font);
        document.execCommand('fontName', false, font);
    };

    const changeFontSize = (size: FontSize) => {
        setFontSize(size);
        // execCommand uses 1-7 scale, we'll use CSS instead
        if (editorRef.current) {
            editorRef.current.style.fontSize = `${size}px`;
        }
    };

    const getStats = (text: string) => {
        const lines = text.split('\n').length;
        const chars = text.length;
        return { lines, chars };
    };

    const stats = getStats(content || '');

    return (
        <div className={styles.textEditor}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                {/* Font Family */}
                <select
                    className={styles.fontSelect}
                    value={fontFamily}
                    onChange={(e) => changeFontFamily(e.target.value as FontFamily)}
                >
                    <option value="Geneva">Geneva</option>
                    <option value="Times">Times</option>
                    <option value="Courier">Courier</option>
                    <option value="Helvetica">Helvetica</option>
                </select>

                {/* Font Size */}
                <select
                    className={styles.sizeSelect}
                    value={fontSize}
                    onChange={(e) => changeFontSize(parseInt(e.target.value) as FontSize)}
                >
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="18">18</option>
                    <option value="24">24</option>
                </select>

                <div className={styles.separator}></div>

                {/* Style Buttons */}
                <button
                    className={`${styles.styleButton} ${isBold ? styles.active : ''}`}
                    onClick={applyBold}
                    title="Bold (粗体)"
                >
                    B
                </button>
                <button
                    className={`${styles.styleButton} ${isItalic ? styles.active : ''}`}
                    onClick={applyItalic}
                    title="Italic (斜体)"
                >
                    <em>I</em>
                </button>
                <button
                    className={`${styles.styleButton} ${isUnderline ? styles.active : ''}`}
                    onClick={applyUnderline}
                    title="Underline (下划线)"
                >
                    <u>U</u>
                </button>

                <div className={styles.separator}></div>

                {/* Alignment Buttons */}
                <button
                    className={`${styles.styleButton} ${alignment === 'left' ? styles.active : ''}`}
                    onClick={() => applyAlignment('left')}
                    title="Align Left"
                >
                    ⬱
                </button>
                <button
                    className={`${styles.styleButton} ${alignment === 'center' ? styles.active : ''}`}
                    onClick={() => applyAlignment('center')}
                    title="Center"
                >
                    ≡
                </button>
                <button
                    className={`${styles.styleButton} ${alignment === 'right' ? styles.active : ''}`}
                    onClick={() => applyAlignment('right')}
                    title="Align Right"
                >
                    ⬲
                </button>

                <div className={styles.separator}></div>

                {/* Word Wrap Toggle */}
                <button
                    className={`${styles.styleButton} ${wordWrap ? styles.active : ''}`}
                    onClick={() => setWordWrap(!wordWrap)}
                    title="Word Wrap"
                >
                    ↩
                </button>

                {/* Ruler Toggle */}
                <button
                    className={`${styles.styleButton} ${showRuler ? styles.active : ''}`}
                    onClick={() => setShowRuler(!showRuler)}
                    title="Show Ruler"
                >
                    📏
                </button>

                <div className={styles.separator}></div>

                {/* Save Button */}
                <button
                    className={`${styles.saveButton} ${isDirty ? styles.dirty : ''}`}
                    onClick={handleSave}
                    title="Save (保存)"
                >
                    💾 Save{isDirty ? ' *' : ''}
                </button>

                {/* Help Button */}
                <button
                    className={styles.helpButton}
                    onClick={() => setShowHelp(!showHelp)}
                    title="Help (帮助)"
                >
                    ?
                </button>
            </div>

            {/* Ruler */}
            {showRuler && (
                <div className={styles.ruler}>
                    {Array.from({ length: 20 }, (_, i) => (
                        <span key={i} className={styles.rulerMark}>{i * 5}</span>
                    ))}
                </div>
            )}

            {/* Editor Area */}
            <div className={styles.editorArea} onContextMenu={(e) => e.stopPropagation()}>
                <div
                    ref={editorRef}
                    className={styles.content}
                    contentEditable
                    onInput={handleInput}
                    data-testid="text-editor-content"
                    style={{
                        fontFamily: `var(--font-${fontFamily.toLowerCase()})`,
                        fontSize: `${fontSize}px`,
                        whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                        textAlign: alignment,
                        fontWeight: 'normal'
                    }}
                    suppressContentEditableWarning
                />
            </div>

            {/* Status Bar */}
            <div className={styles.statusBar}>
                <span>Lines: {stats.lines}</span>
                <span className={styles.divider}>|</span>
                <span>Characters: {stats.chars}</span>
                <span className={styles.divider}>|</span>
                <span>{fileName}</span>
            </div>

            {/* Help Dialog */}
            {showHelp && (
                <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
                    <div className={styles.helpDialog} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.helpTitle}>Text Editor Help</div>
                        <div className={styles.helpContent}>
                            <h3>工具栏说明</h3>
                            <ul>
                                <li><strong>字体选择器</strong> - 选择文本字体（Geneva, Times, Courier, Helvetica）</li>
                                <li><strong>字号选择器</strong> - 选择文字大小（9-24pt）</li>
                                <li><strong>B</strong> - 粗体格式化</li>
                                <li><strong>I</strong> - 斜体格式化</li>
                                <li><strong>U</strong> - 下划线格式化</li>
                                <li><strong>⬱</strong> - 左对齐</li>
                                <li><strong>≡</strong> - 居中对齐</li>
                                <li><strong>⬲</strong> - 右对齐</li>
                                <li><strong>↩</strong> - 自动换行开/关</li>
                                <li><strong>📏</strong> - 显示/隐藏标尺</li>
                                <li><strong>💾 Save</strong> - 保存文件（未保存时显示 *）</li>
                            </ul>
                            <h3>快捷键</h3>
                            <ul>
                                <li><strong>Ctrl/Cmd + B</strong> - 粗体</li>
                                <li><strong>Ctrl/Cmd + I</strong> - 斜体</li>
                                <li><strong>Ctrl/Cmd + U</strong> - 下划线</li>
                            </ul>
                        </div>
                        <div className={styles.helpButtons}>
                            <button className={styles.okButton} onClick={() => setShowHelp(false)}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextEditor;
