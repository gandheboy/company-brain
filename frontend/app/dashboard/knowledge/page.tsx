'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface KnowledgeNode {
  id: string
  title: string
  content: string
  type: string
  applies_to: string
  confidence_score: number
  is_verified: boolean
  is_outdated: boolean
  created_at: string
}

export default function KnowledgeExplorer() {
  const router = useRouter()
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [filtered, setFiltered] = useState<KnowledgeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadNodes()
  }, [])

  useEffect(() => {
    filterNodes()
  }, [nodes, search, typeFilter])

  const loadNodes = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        'http://localhost:8000/api/knowledge/nodes-test'
      )
      const result = await response.json()
      setNodes(result.nodes || [])
    } catch (error) {
      console.error('Failed to load nodes:', error)
    }
    setLoading(false)
  }

  const filterNodes = () => {
    let result = [...nodes]

    if (typeFilter !== 'all') {
      result = result.filter(n => n.type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }

  const handleVerify = async (nodeId: string) => {
    setActionLoading(nodeId)
    try {
      await fetch(
        `http://localhost:8000/api/knowledge/nodes/${nodeId}/verify-test`,
        { method: 'PATCH' }
      )
      setNodes(prev => prev.map(n =>
        n.id === nodeId ? { ...n, is_verified: true } : n
      ))
    } catch (error) {
      console.error('Failed to verify:', error)
    }
    setActionLoading(null)
  }

  const handleDelete = async (nodeId: string) => {
    setActionLoading(nodeId)
    try {
      await fetch(
        `http://localhost:8000/api/knowledge/nodes/${nodeId}/delete-test`,
        { method: 'DELETE' }
      )
      setNodes(prev => prev.filter(n => n.id !== nodeId))
      if (selectedNode?.id === nodeId) setSelectedNode(null)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
    setActionLoading(null)
  }

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      policy: '#1e3a5f',
      procedure: '#1a2e1a',
      decision: '#2d1f00',
      context: '#1e1b4b'
    }
    return colors[type] || '#1e293b'
  }

  const typeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      policy: '#93c5fd',
      procedure: '#86efac',
      decision: '#fbbf24',
      context: '#a78bfa'
    }
    return colors[type] || '#94a3b8'
  }

  const types = ['all', 'policy', 'procedure', 'decision', 'context']

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            Company Brain
          </h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '0.4rem 1rem',
            backgroundColor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          ← Dashboard
        </button>
      </div>

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Title + Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '0.4rem'
            }}>
              🧠 Knowledge Explorer
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem'
            }}>
              {filtered.length} of {nodes.length} knowledge nodes
            </p>
          </div>
          <button
            onClick={loadNodes}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.6rem 1rem',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />

          {/* Type filter */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: typeFilter === type
                    ? '#3b82f6'
                    : '#0f172a',
                  color: typeFilter === type
                    ? 'white'
                    : '#64748b',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textTransform: 'capitalize'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#64748b'
          }}>
            Loading knowledge nodes...
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#64748b'
          }}>
            No knowledge nodes found.
          </div>
        )}

        {/* Two column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedNode
            ? '1fr 1fr'
            : '1fr',
          gap: '1rem'
        }}>
          {/* Nodes list */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {filtered.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(
                  selectedNode?.id === node.id ? null : node
                )}
                style={{
                  backgroundColor: selectedNode?.id === node.id
                    ? '#0f2040'
                    : '#0f172a',
                  border: selectedNode?.id === node.id
                    ? '1px solid #3b82f6'
                    : '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '1rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Type badge + verified */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.4rem',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        backgroundColor: typeColor(node.type),
                        color: typeBadgeColor(node.type),
                        padding: '0.1rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {node.type}
                      </span>
                      {node.is_verified && (
                        <span style={{
                          color: '#22c55e',
                          fontSize: '0.75rem'
                        }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      marginBottom: '0.3rem'
                    }}>
                      {node.title}
                    </div>

                    {/* Content preview */}
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.8rem',
                      lineHeight: '1.4'
                    }}>
                      {node.content.length > 100
                        ? node.content.slice(0, 100) + '...'
                        : node.content}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div style={{
                    marginLeft: '1rem',
                    textAlign: 'right',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: node.confidence_score > 0.8
                        ? '#22c55e'
                        : '#f59e0b'
                    }}>
                      {Math.round(node.confidence_score * 100)}%
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#475569'
                    }}>
                      confidence
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Node detail panel */}
          {selectedNode && (
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              height: 'fit-content',
              position: 'sticky',
              top: '1rem'
            }}>
              {/* Detail header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <span style={{
                  backgroundColor: typeColor(selectedNode.type),
                  color: typeBadgeColor(selectedNode.type),
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}>
                  {selectedNode.type}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.1rem',
                marginBottom: '1rem'
              }}>
                {selectedNode.title}
              </h3>

              {/* Content */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                color: '#cbd5e1',
                marginBottom: '1rem'
              }}>
                {selectedNode.content}
              </div>

              {/* Meta */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: '#64748b' }}>
                    Applies to
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {selectedNode.applies_to || 'All'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>
                    Confidence
                  </div>
                  <div style={{
                    color: selectedNode.confidence_score > 0.8
                      ? '#22c55e'
                      : '#f59e0b'
                  }}>
                    {Math.round(
                      selectedNode.confidence_score * 100
                    )}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>
                    Status
                  </div>
                  <div style={{
                    color: selectedNode.is_verified
                      ? '#22c55e'
                      : '#64748b'
                  }}>
                    {selectedNode.is_verified
                      ? '✓ Verified'
                      : 'Unverified'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>
                    Added
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {new Date(selectedNode.created_at)
                      .toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {!selectedNode.is_verified && (
                  <button
                    onClick={() => handleVerify(selectedNode.id)}
                    disabled={actionLoading === selectedNode.id}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      backgroundColor: '#166534',
                      color: '#86efac',
                      border: '1px solid #16a34a',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ✓ Verify
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedNode.id)}
                  disabled={actionLoading === selectedNode.id}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    backgroundColor: '#450a0a',
                    color: '#fca5a5',
                    border: '1px solid #7f1d1d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}