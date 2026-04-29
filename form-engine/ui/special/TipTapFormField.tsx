import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useFormContext } from "react-hook-form";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";
import { FormFieldWrapper } from "../../FormFieldWrapper";
import type { FormField } from "../../types/formTypeStructure";
import { SpecialField } from "../../types/formTypeStructure";

interface TipTapFormField extends FormField {
  fieldType: SpecialField.TIP_TAP_DOC_TEXT;
}

interface TipTapFormFieldProps {
  field: TipTapFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

const TipTapFormField: React.FC<TipTapFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: "Écrivez votre texte ici... (Utilisez le menu pour formater)",
      }),
    ],
    content: defaultValue || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue(fieldName, html, {
        shouldValidate: true,
        shouldTouch: true,
      });
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Entrez l\'URL de l\'image:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className={`border-2 border-gray-300 rounded-lg overflow-hidden ${className || ''}`}>
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap items-center gap-1">
          {/* Texte gras */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <Bold size={18} />
          </button>

          {/* Italique */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <Italic size={18} />
          </button>

          {/* Souligné */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('strike') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <Underline size={18} />
          </button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Titres */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <Heading1 size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <Heading2 size={18} />
          </button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Listes */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <List size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <ListOrdered size={18} />
          </button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lien */}
          <button
            type="button"
            onClick={setLink}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('link') ? 'bg-teal-100 text-teal-600' : 'text-gray-700'
            }`}
          >
            <LinkIcon size={18} />
          </button>

          {/* Image */}
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
          >
            <ImageIcon size={18} />
          </button>
        </div>

        {/* Éditeur */}
        <div className="prose prose-sm max-w-none">
          <EditorContent 
            editor={editor}
            className="p-4 min-h-48 focus-within:outline-none prose-headings:text-teal-700 prose-strong:text-teal-600"
          />
        </div>
      </div>
    </FormFieldWrapper>
  );
};

export default TipTapFormField;

