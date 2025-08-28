'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassCodeDisplay({ classCode, className = "" }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(classCode)
      setCopied(true)
      toast.success('Class code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = classCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success('Class code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg ${className}`}>
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Class Code:</p>
        <p className="text-lg font-mono font-bold text-blue-800 dark:text-blue-200">{classCode}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        title="Copy class code"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  )
}