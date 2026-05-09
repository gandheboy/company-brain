'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Skill {
  id: string
  name: string
  description: string
  trigger_conditions: string[]
  steps: string[]
  exceptions: string[]
  escalation_path: string | null
  confidence: number
}

interface SkillsFile {
  company: string
  version: string
  generated_at: string
  total_skills: number
  total_nodes_used: number
  skills: Skill[]
}

export default function SkillsPage() {
  const router = useRouter()
  const [skillsFile, setSkillsFile] = useState<SkillsFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        'http://localhost:8000/api/skills/generate-test',
        { method: 'POST' }
      )
      const result = await response.json()
      if (result.skills_file) {
        setSkillsFile(result.skills_file)
      }
    } catch (error) {
      console.error('Failed to generate skills file:', error)
    }
    setLoading(false)
  }

  const handleDownload = () => {
    if (!skillsFile) return
    const blob = new Blob(
      [JSON.stringify(skillsFile, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skillsFile.company.replace(/\s+/g, '-')}-skills.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}>
              ⚡ Skills File Generator
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem'
            }}>
              Generate a machine-readable skills file
              your AI agents can use.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            {skillsFile && (
              <button
                onClick={handleDownload}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#166534',
                  color: '#86efac',
                  border: '1px solid #16a34a',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}
              >
                ↓ Download JSON
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: loading
                  ? '#1e293b'
                  : '#7c3aed',
                color: loading ? '#475569' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}
            >
              {loading
                ? '⚡ Generating...'
                : '⚡ Generate Skills File'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              ⚡
            </div>
            <p style={{ color: '#64748b' }}>
              Analyzing knowledge and generating skills...
            </p>
            <p style={{
              color: '#475569',
              fontSize: '0.8rem',
              marginTop: '0.5rem'
            }}>
              This takes 30-60 seconds
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !skillsFile && (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📋
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              No Skills File Yet
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}>
              Click Generate to create a skills file
              from your company knowledge.
            </p>
          </div>
        )}

        {/* Skills file result */}
        {skillsFile && !loading && (
          <>
            {/* Meta info */}
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e3a5f',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.25rem'
                }}>
                  Company
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {skillsFile.company}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.25rem'
                }}>
                  Total Skills
                </div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#a78bfa'
                }}>
                  {skillsFile.total_skills || skillsFile.skills?.length}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.25rem'
                }}>
                  Knowledge Nodes Used
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {skillsFile.total_nodes_used}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.25rem'
                }}>
                  Version
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {skillsFile.version}
                </div>
              </div>
            </div>

            {/* Skills list */}
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {skillsFile.skills?.map((skill, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#0f172a',
                    border: selectedSkill?.id === skill.id
                      ? '1px solid #7c3aed'
                      : '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedSkill(
                    selectedSkill?.id === skill.id
                      ? null
                      : skill
                  )}
                >
                  {/* Skill header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: selectedSkill?.id === skill.id
                      ? '1rem'
                      : '0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{
                        backgroundColor: '#1e1b4b',
                        color: '#a78bfa',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.95rem'
                        }}>
                          {skill.name}
                        </div>
                        {skill.description && (
                          <div style={{
                            color: '#64748b',
                            fontSize: '0.8rem',
                            marginTop: '0.2rem'
                          }}>
                            {skill.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      {skill.confidence && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: skill.confidence > 0.8
                            ? '#22c55e'
                            : '#f59e0b'
                        }}>
                          {Math.round(skill.confidence * 100)}%
                        </span>
                      )}
                      <span style={{
                        color: '#475569',
                        fontSize: '0.8rem'
                      }}>
                        {selectedSkill?.id === skill.id
                          ? '▲'
                          : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded skill detail */}
                  {selectedSkill?.id === skill.id && (
                    <div style={{
                      borderTop: '1px solid #1e293b',
                      paddingTop: '1rem'
                    }}>
                      {/* Triggers */}
                      {skill.trigger_conditions?.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                          }}>
                            When to use
                          </div>
                          {skill.trigger_conditions.map((t, i) => (
                            <div key={i} style={{
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              padding: '0.25rem 0'
                            }}>
                              → {t}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Steps */}
                      {skill.steps?.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                          }}>
                            Steps
                          </div>
                          {skill.steps.map((step, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              gap: '0.75rem',
                              padding: '0.4rem 0',
                              borderBottom: '1px solid #1e293b',
                              fontSize: '0.85rem'
                            }}>
                              <span style={{
                                color: '#7c3aed',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}>
                                {i + 1}.
                              </span>
                              <span style={{ color: '#cbd5e1' }}>
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Exceptions */}
                      {skill.exceptions?.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                          }}>
                            Exceptions
                          </div>
                          {skill.exceptions.map((ex, i) => (
                            <div key={i} style={{
                              color: '#fca5a5',
                              fontSize: '0.85rem',
                              padding: '0.25rem 0'
                            }}>
                              ⚠ {ex}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Escalation */}
                      {skill.escalation_path && (
                        <div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                          }}>
                            Escalation
                          </div>
                          <div style={{
                            color: '#fbbf24',
                            fontSize: '0.85rem'
                          }}>
                            ↑ {skill.escalation_path}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}