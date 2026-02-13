import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Calendar, Users, TrendingUp, MapPin, Clock, FileText, BarChart3, Home, ClipboardCheck, Rocket } from 'lucide-react';

// Storage polyfill for deployment (replaces window.storage with localStorage)
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key);
      return value ? { key, value } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
      return { key, value };
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    list: async (prefix) => {
      const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
      return { keys };
    }
  };
}

// BCS Brand Colors
const BCS_COLORS = {
  navy: '#2B3E50',
  darkNavy: '#1a2633',
  coral: '#FF6B6B',
  orange: '#FFA94D',
  cyan: '#4ECDC4',
  white: '#FFFFFF',
  lightGray: '#F8F9FA'
};

// Mock data for demo
const DEMO_CLIENTS = [
  { id: 'bcs-office', name: 'BCS Headquarters', password: 'test123', sites: ['Main Office', 'Conference Floor'] },
];

const DEMO_INSPECTIONS = [];

const BCSCommandCenter = () => {
  const [view, setView] = useState('login');
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [expandedInspection, setExpandedInspection] = useState(null);
  const [newInspection, setNewInspection] = useState({
    clientId: '',
    site: '',
    areas: [],
    inspector: ''
  });

  // Compress image to reduce storage size
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Parse checklist file and extract inspection areas
  const parseChecklist = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const areas = [];
          
          if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(line => line.trim());
            lines.forEach((line, idx) => {
              if (idx === 0 && (line.toLowerCase().includes('task') || line.toLowerCase().includes('area'))) {
                return;
              }
              const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
              if (parts[0]) {
                areas.push({
                  name: parts[0],
                  score: 100,
                  notes: '',
                  photos: []
                });
              }
            });
          }
          else if (file.name.endsWith('.txt')) {
            const lines = content.split('\n').filter(line => line.trim());
            lines.forEach(line => {
              const cleaned = line.trim().replace(/^[-•*]\s*/, '');
              if (cleaned && !cleaned.toLowerCase().includes('checklist') && !cleaned.toLowerCase().includes('complete care')) {
                areas.push({
                  name: cleaned,
                  score: 100,
                  notes: '',
                  photos: []
                });
              }
            });
          }
          else if (file.name.endsWith('.json')) {
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
              data.forEach(item => {
                const areaName = item.name || item.task || item.area || item.title || String(item);
                if (areaName) {
                  areas.push({
                    name: areaName,
                    score: 100,
                    notes: '',
                    photos: []
                  });
                }
              });
            } else if (data.tasks || data.items || data.areas) {
              const items = data.tasks || data.items || data.areas;
              items.forEach(item => {
                areas.push({
                  name: item.name || item.task || item.title || String(item),
                  score: 100,
                  notes: '',
                  photos: []
                });
              });
            }
          }
          
          resolve(areas);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      const stored = await window.storage.get('bcs-inspections');
      if (stored) {
        setInspections(JSON.parse(stored.value));
      } else {
        setInspections(DEMO_INSPECTIONS);
        await window.storage.set('bcs-inspections', JSON.stringify(DEMO_INSPECTIONS));
      }
    } catch (error) {
      setInspections(DEMO_INSPECTIONS);
    }
  };

  const saveInspections = async (newInspections) => {
    setInspections(newInspections);
    try {
      await window.storage.set('bcs-inspections', JSON.stringify(newInspections));
    } catch (error) {
      console.error('Failed to save inspections:', error);
    }
  };

  const handleLogin = (type, credentials) => {
    if (type === 'client') {
      const client = DEMO_CLIENTS.find(c => c.id === credentials.clientId && c.password === credentials.password);
      if (client) {
        setCurrentUser(client);
        setUserType('client');
        setView('client-dashboard');
      } else {
        alert('Invalid credentials');
      }
    } else if (type === 'manager') {
      if (credentials.password === 'bcs2026') {
        setCurrentUser({ name: credentials.name });
        setUserType('manager');
        setView('manager-dashboard');
      } else {
        alert('Invalid password');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    setView('login');
  };

  const submitInspection = async () => {
    const totalScore = newInspection.areas.reduce((sum, area) => sum + area.score, 0) / newInspection.areas.length;
    const inspection = {
      id: Date.now().toString(),
      ...newInspection,
      date: new Date().toISOString(),
      score: Math.round(totalScore),
      status: totalScore >= 80 ? 'passed' : 'needs-attention'
    };
    
    const updated = [inspection, ...inspections];
    await saveInspections(updated);
    
    setNewInspection({
      clientId: '',
      site: '',
      areas: [],
      inspector: ''
    });
    
    alert('Inspection submitted successfully!');
    setView('manager-dashboard');
  };

  const getClientInspections = () => {
    if (!currentUser) return [];
    return inspections.filter(i => i.clientId === currentUser.id);
  };

  const getMetrics = () => {
    const total = inspections.length;
    if (total === 0) return { total: 0, avgScore: 0, passRate: 0, last7Days: 0 };
    const avgScore = inspections.reduce((sum, i) => sum + i.score, 0) / total;
    const passed = inspections.filter(i => i.status === 'passed').length;
    const last7Days = inspections.filter(i => {
      const days = (new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length;
    
    return { total, avgScore: Math.round(avgScore), passRate: Math.round((passed / total) * 100), last7Days };
  };

  // BCS Logo Component
  const BCSLogo = ({ size = 'large' }) => (
    <div className={`flex items-center gap-3 ${size === 'large' ? 'mb-4' : ''}`}>
      <div className="flex items-center gap-2">
        <Rocket 
          size={size === 'large' ? 40 : 24} 
          className="text-coral-500"
          style={{ color: BCS_COLORS.coral }}
        />
        <div className={size === 'large' ? 'text-3xl font-bold' : 'text-xl font-bold'} style={{ color: BCS_COLORS.white }}>
          BCS
        </div>
      </div>
    </div>
  );

  // Login Screen
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${BCS_COLORS.navy} 0%, ${BCS_COLORS.darkNavy} 100%)` }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <BCSLogo size="large" />
              <h1 className="text-3xl font-bold mb-2" style={{ color: BCS_COLORS.navy }}>Command Center</h1>
              <p className="text-gray-600">Real-time facility service management</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setView('client-login')}
                className="w-full text-white font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: BCS_COLORS.cyan }}
              >
                <Users size={20} />
                Client Portal Login
              </button>

              <button
                onClick={() => setView('manager-login')}
                className="w-full text-white font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: BCS_COLORS.coral }}
              >
                <ClipboardCheck size={20} />
                Manager Login
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-3">Demo Credentials:</p>
              <div className="space-y-2 text-xs text-gray-500">
                <p><strong>Client:</strong> bcs-office / test123</p>
                <p><strong>Manager:</strong> Any name / bcs2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client Login Form
  if (view === 'client-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${BCS_COLORS.cyan} 0%, ${BCS_COLORS.navy} 100%)` }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: BCS_COLORS.navy }}>Client Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                <input
                  type="text"
                  id="clientId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: BCS_COLORS.cyan }}
                  placeholder="e.g., bcs-office"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  id="clientPassword"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: BCS_COLORS.cyan }}
                />
              </div>
              <button
                onClick={() => {
                  const clientId = document.getElementById('clientId').value;
                  const password = document.getElementById('clientPassword').value;
                  handleLogin('client', { clientId, password });
                }}
                className="w-full text-white font-semibold py-3 px-6 rounded-lg transition duration-200 hover:opacity-90"
                style={{ backgroundColor: BCS_COLORS.cyan }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manager Login Form
  if (view === 'manager-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${BCS_COLORS.coral} 0%, ${BCS_COLORS.orange} 100%)` }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: BCS_COLORS.navy }}>Manager Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  id="managerName"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  id="managerPassword"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  const name = document.getElementById('managerName').value;
                  const password = document.getElementById('managerPassword').value;
                  handleLogin('manager', { name, password });
                }}
                className="w-full text-white font-semibold py-3 px-6 rounded-lg transition duration-200 hover:opacity-90"
                style={{ backgroundColor: BCS_COLORS.coral }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client Dashboard
  if (view === 'client-dashboard') {
    const clientInspections = getClientInspections();
    const recentInspections = clientInspections.slice(0, 10);
    const avgScore = clientInspections.length > 0 
      ? clientInspections.reduce((sum, i) => sum + i.score, 0) / clientInspections.length 
      : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200" style={{ backgroundColor: BCS_COLORS.navy }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <BCSLogo size="small" />
                <h1 className="text-2xl font-bold" style={{ color: BCS_COLORS.white }}>Welcome, {currentUser.name}</h1>
                <p style={{ color: BCS_COLORS.white, opacity: 0.8 }}>Your facilities at a glance</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 hover:opacity-80"
                style={{ color: BCS_COLORS.white }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.cyan}20` }}>
                  <BarChart3 style={{ color: BCS_COLORS.cyan }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Average Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{Math.round(avgScore)}%</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.coral}20` }}>
                  <CheckCircle style={{ color: BCS_COLORS.coral }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Total Inspections</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{clientInspections.length}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.orange}20` }}>
                  <MapPin style={{ color: BCS_COLORS.orange }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Active Sites</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{currentUser.sites.length}</div>
            </div>
          </div>

          {recentInspections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ClipboardCheck size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inspections Yet</h3>
              <p className="text-gray-600">Inspections from your BCS team will appear here</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Inspections</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentInspections.map(inspection => (
                  <div key={inspection.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{inspection.site}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium`}
                            style={{
                              backgroundColor: inspection.score >= 90 ? `${BCS_COLORS.coral}20` : 
                                            inspection.score >= 80 ? `${BCS_COLORS.cyan}20` : 
                                            `${BCS_COLORS.orange}20`,
                              color: inspection.score >= 90 ? BCS_COLORS.coral :
                                     inspection.score >= 80 ? BCS_COLORS.cyan :
                                     BCS_COLORS.orange
                            }}>
                            Score: {inspection.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(inspection.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(inspection.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {inspection.inspector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {inspection.areas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{area.name}</span>
                              {(area.photos?.length > 0 || area.photo) && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: BCS_COLORS.cyan }}>
                                  <Camera size={14} />
                                  {area.photos?.length > 0 ? `${area.photos.length} Photos` : 'Photo'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">{area.notes}</span>
                              <span className="font-semibold text-gray-900">{area.score}%</span>
                            </div>
                          </div>
                          {area.photos?.length > 0 && (
                            <div className="mt-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {area.photos.map((photo, photoIdx) => (
                                  <img 
                                    key={photoIdx}
                                    src={photo} 
                                    alt={`${area.name} ${photoIdx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                    onClick={() => window.open(photo, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {area.photoData && !area.photos && (
                            <div className="mt-2">
                              <img 
                                src={area.photoData} 
                                alt={`${area.name}`}
                                className="w-full max-w-md rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                onClick={() => window.open(area.photoData, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manager Dashboard
  if (view === 'manager-dashboard') {
    const metrics = getMetrics();

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-white" style={{ backgroundColor: BCS_COLORS.navy }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <BCSLogo size="small" />
                <h1 className="text-2xl font-bold">Manager Dashboard</h1>
                <p className="opacity-80">Welcome, {currentUser.name}</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setView('submit-inspection')}
                  className="px-4 py-2 rounded-lg font-medium transition hover:opacity-90"
                  style={{ backgroundColor: BCS_COLORS.coral }}
                >
                  + New Inspection
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 hover:opacity-80"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.cyan}20` }}>
                  <ClipboardCheck style={{ color: BCS_COLORS.cyan }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Total Inspections</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.total}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.coral}20` }}>
                  <TrendingUp style={{ color: BCS_COLORS.coral }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Avg Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.avgScore}%</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.orange}20` }}>
                  <CheckCircle style={{ color: BCS_COLORS.orange }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Pass Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.passRate}%</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${BCS_COLORS.navy}20` }}>
                  <Calendar style={{ color: BCS_COLORS.navy }} size={24} />
                </div>
                <span className="text-gray-600 text-sm">Last 7 Days</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{metrics.last7Days}</div>
            </div>
          </div>

          {inspections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ClipboardCheck size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inspections Yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first inspection</p>
              <button
                onClick={() => setView('submit-inspection')}
                className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: BCS_COLORS.coral }}
              >
                Create Inspection
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">All Inspections</h2>
                  <p className="text-sm text-gray-600">Click any row to view photos and details</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inspections.map(inspection => {
                      const client = DEMO_CLIENTS.find(c => c.id === inspection.clientId);
                      const isExpanded = expandedInspection === inspection.id;
                      const hasPhotos = inspection.areas.some(area => area.photos?.length > 0 || area.photoData);
                      
                      return (
                        <React.Fragment key={inspection.id}>
                          <tr 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setExpandedInspection(isExpanded ? null : inspection.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(inspection.date).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {client?.name || inspection.clientId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inspection.site}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inspection.inspector}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: inspection.score >= 90 ? `${BCS_COLORS.coral}20` : 
                                                inspection.score >= 80 ? `${BCS_COLORS.cyan}20` : 
                                                `${BCS_COLORS.orange}20`,
                                  color: inspection.score >= 90 ? BCS_COLORS.coral :
                                         inspection.score >= 80 ? BCS_COLORS.cyan :
                                         BCS_COLORS.orange
                                }}>
                                {inspection.score}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1`}
                                  style={{ color: inspection.status === 'passed' ? BCS_COLORS.coral : BCS_COLORS.orange }}>
                                  {inspection.status === 'passed' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                  {inspection.status}
                                </span>
                                {hasPhotos && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: BCS_COLORS.cyan }}>
                                    <Camera size={16} />
                                    {inspection.areas.reduce((total, area) => total + (area.photos?.length || 0), 0)}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 mb-3">Inspection Details</h4>
                                  {inspection.areas.map((area, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium text-gray-900">{area.name}</span>
                                          <span className="text-sm font-semibold text-gray-700">{area.score}%</span>
                                          {area.photos?.length > 0 && (
                                            <span className="text-xs" style={{ color: BCS_COLORS.cyan }}>
                                              {area.photos.length} {area.photos.length === 1 ? 'photo' : 'photos'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {area.notes && (
                                        <p className="text-sm text-gray-600 mb-2">{area.notes}</p>
                                      )}
                                      {area.photos?.length > 0 && (
                                        <div className="mt-3">
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {area.photos.map((photo, photoIdx) => (
                                              <img 
                                                key={photoIdx}
                                                src={photo} 
                                                alt={`${area.name} ${photoIdx + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(photo, '_blank');
                                                }}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {area.photoData && !area.photos && (
                                        <div className="mt-2">
                                          <img 
                                            src={area.photoData} 
                                            alt={`${area.name}`}
                                            className="w-full max-w-lg rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(area.photoData, '_blank');
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Submit Inspection Form
  if (view === 'submit-inspection') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-white" style={{ backgroundColor: BCS_COLORS.navy }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Submit New Inspection</h1>
              <button
                onClick={() => setView('manager-dashboard')}
                className="px-4 py-2 hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select
                  value={newInspection.clientId}
                  onChange={(e) => setNewInspection({...newInspection, clientId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  style={{ focusRingColor: BCS_COLORS.cyan }}
                  required
                >
                  <option value="">Select client...</option>
                  {DEMO_CLIENTS.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site/Building</label>
                <input
                  type="text"
                  value={newInspection.site}
                  onChange={(e) => setNewInspection({...newInspection, site: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  style={{ focusRingColor: BCS_COLORS.cyan }}
                  placeholder="e.g., Main Office"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inspector Name</label>
                <input
                  type="text"
                  value={newInspection.inspector}
                  onChange={(e) => setNewInspection({...newInspection, inspector: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  style={{ focusRingColor: BCS_COLORS.cyan }}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <div className="mb-4 p-4 rounded-lg border-2" style={{ 
                  backgroundColor: `${BCS_COLORS.cyan}10`,
                  borderColor: BCS_COLORS.cyan
                }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <FileText size={18} style={{ color: BCS_COLORS.cyan }} />
                        Import Connecteam Checklist
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Upload your Complete Care checklist to auto-populate all inspection areas
                      </p>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700 font-medium mb-1">
                          Supported formats & examples
                        </summary>
                        <div className="mt-2 pl-2 space-y-1">
                          <p><strong>CSV:</strong> Task name in first column</p>
                          <p><strong>TXT:</strong> One area per line (bullets optional)</p>
                          <p><strong>JSON:</strong> Array of task names or objects with 'name' field</p>
                        </div>
                      </details>
                    </div>
                    <label className="cursor-pointer flex-shrink-0">
                      <input
                        type="file"
                        accept=".csv,.txt,.json"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const areas = await parseChecklist(file);
                              if (areas.length > 0) {
                                setNewInspection({
                                  ...newInspection,
                                  areas: areas
                                });
                                alert(`✓ Successfully imported ${areas.length} inspection areas from ${file.name}`);
                              } else {
                                alert('No areas found in file. Please check the format.');
                              }
                            } catch (error) {
                              alert('Error parsing checklist. Please check file format.');
                              console.error(error);
                            }
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <div className="text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap hover:opacity-90"
                        style={{ backgroundColor: BCS_COLORS.coral }}>
                        Upload Checklist
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Inspection Areas</label>
                    <p className="text-xs text-gray-500 mt-1">
                      {newInspection.areas.length > 0 
                        ? `${newInspection.areas.length} areas ready to inspect`
                        : 'Upload checklist or manually add areas'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewInspection({
                        ...newInspection,
                        areas: [...newInspection.areas, { name: '', score: 100, notes: '', photos: [] }]
                      });
                    }}
                    className="text-sm font-medium hover:opacity-80"
                    style={{ color: BCS_COLORS.cyan }}
                  >
                    + Add Area
                  </button>
                </div>

                <div className="space-y-4">
                  {newInspection.areas.map((area, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            value={area.name}
                            onChange={(e) => {
                              const updated = [...newInspection.areas];
                              updated[idx].name = e.target.value;
                              setNewInspection({...newInspection, areas: updated});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Area name (e.g., Lobby)"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={area.score}
                            onChange={(e) => {
                              const updated = [...newInspection.areas];
                              updated[idx].score = parseInt(e.target.value);
                              setNewInspection({...newInspection, areas: updated});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Score (0-100)"
                            required
                          />
                        </div>
                        <div>
                          <label className="flex items-center justify-center gap-2 cursor-pointer px-3 py-2 rounded-lg border-2 transition hover:opacity-80"
                            style={{ 
                              backgroundColor: `${BCS_COLORS.cyan}10`,
                              borderColor: BCS_COLORS.cyan
                            }}>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={async (e) => {
                                const files = Array.from(e.target.files);
                                if (files.length > 0) {
                                  const compressedPhotos = await Promise.all(
                                    files.map(file => compressImage(file))
                                  );
                                  const updated = [...newInspection.areas];
                                  updated[idx].photos = [...(updated[idx].photos || []), ...compressedPhotos];
                                  setNewInspection({...newInspection, areas: updated});
                                }
                              }}
                              className="hidden"
                            />
                            <Camera size={16} style={{ color: BCS_COLORS.cyan }} />
                            <span className="text-sm font-medium" style={{ color: BCS_COLORS.cyan }}>
                              {area.photos?.length > 0 ? `${area.photos.length} Photos` : 'Add Photos'}
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-3">
                        <input
                          type="text"
                          value={area.notes}
                          onChange={(e) => {
                            const updated = [...newInspection.areas];
                            updated[idx].notes = e.target.value;
                            setNewInspection({...newInspection, areas: updated});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Notes or observations"
                        />
                      </div>
                      {area.photos?.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Photos ({area.photos.length})</p>
                            <button
                              onClick={() => {
                                const updated = [...newInspection.areas];
                                updated[idx].photos = [];
                                setNewInspection({...newInspection, areas: updated});
                              }}
                              className="text-xs hover:opacity-80"
                              style={{ color: BCS_COLORS.coral }}
                            >
                              Clear All Photos
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {area.photos.map((photo, photoIdx) => (
                              <div key={photoIdx} className="relative group">
                                <img 
                                  src={photo} 
                                  alt={`${area.name} photo ${photoIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...newInspection.areas];
                                    updated[idx].photos = updated[idx].photos.filter((_, i) => i !== photoIdx);
                                    setNewInspection({...newInspection, areas: updated});
                                  }}
                                  className="absolute top-1 right-1 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                                  style={{ backgroundColor: BCS_COLORS.coral }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const updated = newInspection.areas.filter((_, i) => i !== idx);
                          setNewInspection({...newInspection, areas: updated});
                        }}
                        className="mt-2 text-sm hover:opacity-80"
                        style={{ color: BCS_COLORS.coral }}
                      >
                        Remove Area
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={submitInspection}
                  disabled={!newInspection.clientId || !newInspection.site || !newInspection.inspector || newInspection.areas.length === 0}
                  className="flex-1 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: BCS_COLORS.coral }}
                >
                  Submit Inspection
                </button>
                <button
                  onClick={() => setView('manager-dashboard')}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BCSCommandCenter;
