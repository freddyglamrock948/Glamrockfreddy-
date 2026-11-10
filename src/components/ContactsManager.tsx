import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Star,
  Sparkles,
  LogIn,
  LogOut,
  X
} from 'lucide-react';
import {
  auth,
  initAuth,
  signInWithGoogleContacts,
  logoutGoogle,
  fetchGoogleContacts,
  createGoogleContact,
  getFirestoreContacts,
  saveFirestoreContact,
  deleteFirestoreContact,
  PizzaplexContact,
  getCachedAccessToken
} from '../firebase';
import { User } from 'firebase/auth';

export const ContactsManager: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [contacts, setContacts] = useState<PizzaplexContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Modal for new contact creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState<'Superstar VIP' | 'Band Member' | 'Security Officer' | 'Guest' | 'Protégé'>('Superstar VIP');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load contacts from Firestore on mount
  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const list = await getFirestoreContacts();
      if (list && list.length > 0) {
        setContacts(list);
      } else {
        // Default seed contacts for Pizzaplex directory
        const seedContacts: PizzaplexContact[] = [
          {
            id: 'seed-1',
            displayName: 'Gregory (Son & Protégé)',
            email: 'gregory@pizzaplex.superstar',
            phoneNumber: '+1 (555) 019-8710',
            role: 'Protégé',
            notes: 'Primary protected VIP. Stays inside Freddy chest cavity during lockdowns.',
            source: 'manual',
            createdAt: new Date().toISOString()
          },
          {
            id: 'seed-2',
            displayName: 'Cyn (Daughter & Solver)',
            email: 'cyn.absolute.solver@drone.corp',
            phoneNumber: '+1 (555) 019-8711',
            role: 'Protégé',
            notes: 'Daughter animatronic. High-frequency anomaly handler.',
            source: 'manual',
            createdAt: new Date().toISOString()
          },
          {
            id: 'seed-3',
            displayName: 'Vanessa (Security Officer)',
            email: 'vanessa.guard@fazbear.entertainment',
            phoneNumber: '+1 (555) 019-8722',
            role: 'Security Officer',
            notes: 'Night shift security guard. Monitors Pizzaplex surveillance cameras.',
            source: 'manual',
            createdAt: new Date().toISOString()
          }
        ];
        setContacts(seedContacts);
      }
    } catch (err) {
      console.warn('Could not load Firestore contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const res = await signInWithGoogleContacts();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setBannerNotice(`Signed in as ${res.user.displayName || res.user.email}! Google Contacts connected.`);
      }
    } catch (err: any) {
      setBannerNotice(`Sign-in error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-out
  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
    setBannerNotice('Signed out from Google account.');
  };

  // Sync contacts from Google People API
  const handleSyncGoogleContacts = async () => {
    if (!accessToken) {
      setBannerNotice('Please sign in with Google first to access your Google Contacts.');
      return;
    }

    try {
      setIsSyncing(true);
      setBannerNotice('Syncing contacts from Google People API...');
      const googleList = await fetchGoogleContacts(accessToken);

      if (googleList.length === 0) {
        setBannerNotice('No contacts found in your Google account to import.');
        return;
      }

      // Save each to Firestore
      for (const item of googleList.slice(0, 15)) {
        await saveFirestoreContact(item);
      }

      await loadContacts();
      setBannerNotice(`Successfully synced ${Math.min(15, googleList.length)} contacts into Pizzaplex Guestbook!`);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setBannerNotice(`Google Contacts sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Create new contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    try {
      const contactItem: PizzaplexContact = {
        displayName: newContactName.trim(),
        email: newContactEmail.trim() || undefined,
        phoneNumber: newContactPhone.trim() || undefined,
        role: newContactRole,
        notes: newContactNotes.trim() || undefined,
        source: 'manual',
        createdAt: new Date().toISOString()
      };

      // If signed in with Google, also sync to Google Contacts!
      if (accessToken) {
        try {
          await createGoogleContact(accessToken, {
            givenName: newContactName.trim(),
            email: newContactEmail.trim() || undefined,
            phone: newContactPhone.trim() || undefined
          });
        } catch (e) {
          console.warn('Could not sync to Google Contacts directly:', e);
        }
      }

      await saveFirestoreContact(contactItem);
      await loadContacts();

      setShowAddModal(false);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewContactNotes('');
      setBannerNotice(`Superstar contact "${contactItem.displayName}" added successfully!`);
    } catch (err: any) {
      setBannerNotice(`Failed to save contact: ${err.message}`);
    }
  };

  // Delete contact (with safe in-app state confirmation)
  const handleDeleteContact = async (contact: PizzaplexContact) => {
    if (confirmDeleteId !== contact.id) {
      setConfirmDeleteId(contact.id || null);
      setBannerNotice(`Click trash again to confirm removing "${contact.displayName}".`);
      return;
    }

    try {
      if (contact.id && !contact.id.startsWith('seed-')) {
        await deleteFirestoreContact(contact.id);
      }
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setConfirmDeleteId(null);
      setBannerNotice(`Removed "${contact.displayName}".`);
    } catch (err: any) {
      setBannerNotice(`Failed to remove contact: ${err.message}`);
    }
  };

  // Search filter
  const filteredContacts = contacts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.includes(q)) ||
      (c.role && c.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="p-3 bg-[#121c2c] border border-[#53e7ff]/30 rounded-xl text-xs text-[#53e7ff] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ff9b45]" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-[#7d8b9f] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#53e7ff]" />
            <span>Pizzaplex VIP Contacts & Guestbook</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Integrated Google Contacts and Firebase Firestore directory for VIP guests, protected superstars, and guardians.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {googleUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Connected</span>
              </span>
              <button
                onClick={handleSyncGoogleContacts}
                disabled={isSyncing}
                className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff9b45] to-[#ffaa40] text-black rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#ff9b45]/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Google Contacts</span>
              </button>
              <button
                onClick={handleGoogleSignOut}
                className="p-2 text-[#7d8b9f] hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                title="Sign out from Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Connect Google Contacts</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/30 hover:bg-[#53e7ff]/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Directory Search & Summary */}
      <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7d8b9f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search VIP contacts by name, email, phone, or role..."
            className="w-full pl-9 pr-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white placeholder-[#7d8b9f] focus:outline-none focus:border-[#53e7ff]/50"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#7d8b9f] font-mono shrink-0">
          <span>Total VIPs: <strong className="text-white">{contacts.length}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Firestore Synced: <strong className="text-emerald-400">Yes</strong></span>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full p-12 bg-[#121c2c] border border-white/10 rounded-2xl text-center space-y-3">
            <Users className="w-8 h-8 text-[#7d8b9f] mx-auto opacity-50" />
            <div className="text-sm font-bold text-white">No contacts found</div>
            <p className="text-xs text-[#7d8b9f] max-w-sm mx-auto">
              No contacts match your query. Click "Connect Google Contacts" to import your personal contacts or click "Add Contact" to create one.
            </p>
          </div>
        ) : (
          filteredContacts.map((c, idx) => (
            <div
              key={c.id ? `contact-${c.id}` : `contact-${c.displayName || 'vip'}-${idx}`}
              className="bg-[#121c2c] hover:bg-[#142033] border border-white/10 hover:border-[#53e7ff]/30 p-4 rounded-2xl transition-all shadow-lg flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#53e7ff]/20 to-[#ff9b45]/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.displayName} className="w-full h-full object-cover" />
                    ) : (
                      c.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-[#53e7ff] transition-colors">
                      {c.displayName}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ff9b45]/10 text-[#ff9b45] border border-[#ff9b45]/20 mt-0.5 inline-block">
                      {c.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteContact(c)}
                  className="p-1.5 text-[#7d8b9f] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer opacity-40 group-hover:opacity-100"
                  title="Remove contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-[#aab6c9] pt-2 border-t border-white/5 font-mono">
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#53e7ff] shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phoneNumber && (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{c.phoneNumber}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-[11px] text-[#7d8b9f] font-sans italic pt-1 leading-snug">
                    "{c.notes}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c2c] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#ff9b45]" />
                <span>Add Pizzaplex Superstar Contact</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#7d8b9f] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#aab6c9] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  placeholder="e.g. Montgomery Gator, Gregory"
                  className="w-full px-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#53e7ff]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#aab6c9] mb-1">Email Address</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)}
                  placeholder="superstar@pizzaplex.fazbear"
                  className="w-full px-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#53e7ff]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#aab6c9] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  placeholder="+1 (555) 019-8700"
                  className="w-full px-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#53e7ff]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#aab6c9] mb-1">Pizzaplex Role</label>
                <select
                  value={newContactRole}
                  onChange={e => setNewContactRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#53e7ff]/50"
                >
                  <option value="Superstar VIP">Superstar VIP</option>
                  <option value="Band Member">Band Member</option>
                  <option value="Security Officer">Security Officer</option>
                  <option value="Protégé">Protégé</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#aab6c9] mb-1">Notes / Security Clearances</label>
                <textarea
                  value={newContactNotes}
                  onChange={e => setNewContactNotes(e.target.value)}
                  placeholder="Security badge level, safe-zone pass, guardian relationship..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#53e7ff]/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#aab6c9] hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#53e7ff] hover:bg-[#3cd0e6] text-black rounded-xl transition-all shadow-md"
                >
                  Save Superstar Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
