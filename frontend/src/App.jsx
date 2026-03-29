import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, MapPin, DollarSign, Users, Home, List, PlusCircle, LayoutDashboard } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'dashboard'
  const [formData, setFormData] = useState({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' });
  const [images, setImages] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [myListings, setMyListings] = useState([]);

  const fetchListings = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/boardings');
      setMyListings(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (activeTab === 'dashboard') fetchListings(); }, [activeTab]);

  const generateAIDescription = async () => {
    if (!formData.features) return alert("Please enter features!");
    setLoadingAI(true);
    try {
      const res = await axios.post('http://localhost:5001/api/boardings/generate-description', { features: formData.features });
      setFormData({ ...formData, description: res.data.description });
    } catch (err) { alert("AI Error"); }
    setLoadingAI(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('ownerId', '64a7c9f8e4b0a1c2d3e4f5a6');
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    images.forEach(img => data.append('images', img));
    try {
      await axios.post('http://localhost:5001/api/boardings/add', data);
      alert("Boarding Published!");
      setActiveTab('dashboard'); // Auto-switch to show the success!
    } catch (err) { alert("Error adding."); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Full' : 'Available';
    await axios.patch(`http://localhost:5001/api/boardings/${id}/status`, { status: newStatus });
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <Home size={24}/> <span>BoardingHub</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <PlusCircle size={18}/> Add Listing
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <LayoutDashboard size={18}/> My Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 mt-4">
        
        {/* VIEW 1: ADD LISTING PAGE */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-2xl font-bold">Create New Listing</h2>
              <p className="text-slate-500 text-sm">Fill in the details for SLIIT students</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input type="text" placeholder="Title" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <input type="text" placeholder="Location" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, location: e.target.value})} />
                <input type="number" placeholder="Monthly Price" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                <select className="border p-3 rounded-xl outline-none bg-white" onChange={(e) => setFormData({...formData, genderAllowed: e.target.value})}>
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                </select>
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-indigo-900 flex items-center gap-2 text-xs uppercase"><Sparkles size={16}/> AI Description Assistant</label>
                  <button type="button" onClick={generateAIDescription} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:shadow-lg transition">
                    {loadingAI ? "AI Writing..." : "Generate with AI"}
                  </button>
                </div>
                <input type="text" placeholder="e.g. 5 min to SLIIT, WiFi, AC included" className="w-full p-3 rounded-xl border-none shadow-inner" onChange={(e) => setFormData({...formData, features: e.target.value})} />
              </div>
              <textarea rows="4" value={formData.description} placeholder="Final description..." className="w-full border p-4 rounded-xl outline-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
              <input type="file" multiple className="text-sm text-slate-500" onChange={(e) => setImages([...e.target.files])} />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition shadow-xl">Publish Listing</button>
            </form>
          </div>
        )}

        {/* VIEW 2: OWNER DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><LayoutDashboard className="text-indigo-600"/> Manage Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myListings.length === 0 ? <p className="text-slate-400">No listings found. Go add one!</p> : myListings.map(item => (
                <div key={item._id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={12}/> {item.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-3">{item.description}</p>
                  <div className="pt-4 flex gap-2">
                    <button 
                      onClick={() => toggleStatus(item._id, item.status)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition shadow-md"
                    >
                      Mark as {item.status === 'Available' ? 'Full' : 'Available'}
                    </button>
                    <button className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;