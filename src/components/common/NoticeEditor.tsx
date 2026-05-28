/**
 * 공지사항 리치 텍스트 에디터 (Tiptap 기반)
 *
 * 지원 기능:
 * - 굵게/기울임/취소선/제목/리스트
 * - 표 (행/열 추가·삭제)
 * - 이미지 (Supabase Storage 업로드)
 * - 파일 첨부 (PDF/Excel — 본문에 다운로드 링크로 삽입)
 * - 외부 링크
 */

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STORAGE_BUCKET = 'notice-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

interface NoticeEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 border-blue-300'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!editor) return null

  const handleImagePick = () => imageInputRef.current?.click()
  const handleFilePick = () => fileInputRef.current?.click()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('이미지 형식만 업로드 가능합니다 (PNG, JPG, GIF, WEBP)')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('10MB 이하 파일만 업로드 가능합니다')
      return
    }
    try {
      setUploading(true)
      const url = await uploadToStorage(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('PDF 또는 Excel 파일만 업로드 가능합니다')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('10MB 이하 파일만 업로드 가능합니다')
      return
    }
    try {
      setUploading(true)
      const url = await uploadToStorage(file)
      const linkLabel = `📎 ${file.name}`
      editor
        .chain()
        .focus()
        .insertContent(
          `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></p>`
        )
        .run()
    } catch (err) {
      console.error('파일 업로드 실패:', err)
      alert('파일 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('링크 URL을 입력하세요', prev || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="굵게"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="기울임"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="취소선"
      >
        <s>S</s>
      </ToolbarButton>

      <span className="w-px bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="제목"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="소제목"
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="글머리기호"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="번호목록"
      >
        1.
      </ToolbarButton>

      <span className="w-px bg-gray-300 mx-1" />

      <ToolbarButton onClick={insertLink} active={editor.isActive('link')} title="링크">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={insertTable} title="표 삽입">
        ⊞ 표
      </ToolbarButton>
      <ToolbarButton onClick={handleImagePick} disabled={uploading} title="이미지 업로드">
        🖼 이미지
      </ToolbarButton>
      <ToolbarButton onClick={handleFilePick} disabled={uploading} title="파일 첨부 (PDF/Excel)">
        📎 파일
      </ToolbarButton>

      {editor.isActive('table') && (
        <>
          <span className="w-px bg-gray-300 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="행 추가"
          >
            +행
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="열 추가"
          >
            +열
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="행 삭제"
          >
            -행
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="열 삭제"
          >
            -열
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="표 삭제"
          >
            ⊠
          </ToolbarButton>
        </>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {uploading && (
        <span className="ml-auto text-xs text-blue-600 self-center">업로드 중...</span>
      )}
    </div>
  )
}

export default function NoticeEditor({ value, onChange, placeholder }: NoticeEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      Table.configure({ resizable: false, HTMLAttributes: { class: 'notice-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || '내용을 입력하세요' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[240px] p-3 focus:outline-none notice-editor-content',
      },
    },
  })

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
