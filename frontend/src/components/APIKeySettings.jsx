/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { Key, Save, Eye, EyeOff, Trash2, Plus } from 'lucide-react'

export default function APIKeySettings() {
  const [apiKeys, setApiKeys] = useState({})
  const [showKeys, setShowKeys] = useState({})
  const [editingKey, setEditingKey] = useState(null)
  const [newKeyValue, setNewKeyValue] = useState('')
  const [status, setStatus] = useState('')

  const providerInfo = {
    GEMINI_API_KEY: {
      name: 'Google Gemini',
      description: 'Free: 1,500 requests/day. Get from: https://ai.google.dev/',
      placeholder: 'AIzaSyD...',
      order: 1
    },
    OPENAI_API_KEY: {
      name: 'OpenAI GPT',
      description: 'Backup provider. Get from: https://platform.openai.com/api-keys',
      placeholder: 'sk-...',
      order: 2
    },
    ANTHROPIC_API_KEY: {
      name: 'Anthropic Claude',
      description: 'Tertiary provider. Get from: https://console.anthropic.com/',
      placeholder: 'sk-ant-...',
      order: 3
    },
    CUSTOM_API_KEY: {
      name: 'Custom API',
      description: 'For other LLM providers',
      placeholder: 'your_custom_key',
      order: 4
    }
  }

  const sortedProviders = Object.entries(providerInfo).sort((a, b) => a[1].order - b[1].order)

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('placify_api_keys')
    if (stored) {
      try {
        setApiKeys(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load API keys from localStorage')
      }
    }
  }, [])

  const handleSaveKey = (keyName) => {
    if (!newKeyValue.trim()) {
      setStatus('Key cannot be empty')
      return
    }

    const updated = { ...apiKeys, [keyName]: newKeyValue }
    setApiKeys(updated)
    localStorage.setItem('placify_api_keys', JSON.stringify(updated))
    
    setEditingKey(null)
    setNewKeyValue('')
    setStatus(`${keyName} saved successfully`)
    
    setTimeout(() => setStatus(''), 3000)
  }

  const handleDeleteKey = (keyName) => {
    const updated = { ...apiKeys }
    delete updated[keyName]
    setApiKeys(updated)
    localStorage.setItem('placify_api_keys', JSON.stringify(updated))
    
    setStatus(`${keyName} deleted`)
    setTimeout(() => setStatus(''), 3000)
  }

  const toggleShowKey = (keyName) => {
    setShowKeys({
      ...showKeys,
      [keyName]: !showKeys[keyName]
    })
  }

  const exportKeys = () => {
    const dataStr = JSON.stringify(apiKeys, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'placify_api_keys_backup.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importKeys = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        const updated = { ...apiKeys, ...imported }
        setApiKeys(updated)
        localStorage.setItem('placify_api_keys', JSON.stringify(updated))
        setStatus('API keys imported successfully')
        setTimeout(() => setStatus(''), 3000)
      } catch (err) {
        setStatus('Failed to import keys: Invalid JSON')
        setTimeout(() => setStatus(''), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">API Key Management</h1>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Configure your AI provider API keys here. Keys are stored locally in your browser and never sent to our servers needlessly.
      </p>

      {status && (
        <div className={`mb-4 p-3 rounded-lg ${
          status.includes('Failed') 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {status}
        </div>
      )}

      {/* Providers Grid */}
      <div className="space-y-4 mb-8">
        {sortedProviders.map(([keyName, info]) => (
          <div key={keyName} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{info.name}</h3>
                <p className="text-sm text-gray-600">{info.description}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                apiKeys[keyName]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {apiKeys[keyName] ? '✓ Configured' : 'Not Set'}
              </span>
            </div>

            <div className="flex gap-2">
              {editingKey === keyName ? (
                <>
                  <input
                    type="password"
                    placeholder={info.placeholder}
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveKey(keyName)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save size={18} /> Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(null)
                      setNewKeyValue('')
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {apiKeys[keyName] ? (
                    <>
                      <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
                        <span className="text-gray-600 font-mono text-sm">
                          {showKeys[keyName]
                            ? apiKeys[keyName]
                            : '•'.repeat(apiKeys[keyName].length)}
                        </span>
                        <button
                          onClick={() => toggleShowKey(keyName)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showKeys[keyName] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setEditingKey(keyName)
                          setNewKeyValue(apiKeys[keyName])
                        }}
                        className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteKey(keyName)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingKey(keyName)}
                      className="flex-1 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Key
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Import/Export */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Backup & Restore</h3>
        <div className="flex gap-4">
          <button
            onClick={exportKeys}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            📥 Export Keys (Backup)
          </button>
          <label className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer flex items-center justify-center">
            📤 Import Keys
            <input
              type="file"
              accept=".json"
              onChange={importKeys}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How This Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• API keys are stored locally in your browser (localStorage)</li>
          <li>• Keys are automatically sent with each analysis request</li>
          <li>• The backend uses your keys to call the configured providers</li>
          <li>• Supports Gemini, OpenAI, Anthropic, and custom APIs</li>
          <li>• Your keys are never stored on our servers</li>
        </ul>
      </div>
    </div>
  )
}
