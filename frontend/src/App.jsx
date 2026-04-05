import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, MapPin, Users, Home, PlusCircle, LayoutDashboard, Edit2, X } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('browse'); 
  const [formData, setFormData] = useState({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' });
  const [images, setImages] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // NEW WAITLIST STATE
  const [waitlistData, setWaitlistData] = useState([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const fetchListings = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/boardings');
      setMyListings(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (activeTab === 'dashboard' || activeTab === 'browse') fetchListings(); 
  }, [activeTab]);

  const generateAIDescription = async () => {
    if (!formData.features) return alert("Please enter features!");
    setLoadingAI(true);
    try {
      const res = await axios.post('http://localhost:5001/api/boardings/generate-description', { features: formData.features });
      setFormData({ ...formData, description: res.data.description });
    } catch (err) { alert("AI Error"); }
    setLoadingAI(false);
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      location: item.location,
      price: item.price,
      genderAllowed: item.genderAllowed || 'Any',
      features: '', 
      description: item.description
    });
    setActiveTab('add'); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      try {
        await axios.put(`http://localhost:5001/api/boardings/${editingId}`, formData);
        alert("Listing Updated Successfully!");
        setEditingId(null); 
        setFormData({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' }); 
        setActiveTab('dashboard'); 
      } catch (err) { alert("Failed to update."); }
    } else {
      const data = new FormData();
      data.append('ownerId', '64a7c9f8e4b0a1c2d3e4f5a6');
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      images.forEach(img => data.append('images', img));

      try {
        await axios.post('http://localhost:5001/api/boardings/add', data);
        alert("Boarding Published!");
        setFormData({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' });
        setImages([]);
        setActiveTab('dashboard'); 
      } catch (err) { alert("Error adding."); }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Full' : 'Available';
    await axios.patch(`http://localhost:5001/api/boardings/${id}/status`, { status: newStatus });
    fetchListings();
  };

  const deleteListing = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this listing?")) {
      try {
        await axios.delete(`http://localhost:5001/api/boardings/${id}`);
        alert("Listing deleted successfully.");
        fetchListings(); 
      } catch (err) {
        console.error(err);
        alert("Failed to delete the listing.");
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' });
    setActiveTab('dashboard');
  };

  // --- NEW WAITLIST FUNCTIONS ---
  const joinWaitlist = async (boardingId) => {
    const studentName = window.prompt("Enter your Name to join the waitlist:");
    if (!studentName) return;
    const studentEmail = window.prompt("Enter your SLIIT Email:");
    if (!studentEmail) return;

    try {
      await axios.post(`http://localhost:5001/api/boardings/${boardingId}/waitlist`, {
        studentName,
        studentEmail
      });
      alert("You have been added to the waitlist! The owner will notify you when it becomes available.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join waitlist.");
    }
  };

  const viewWaitlist = async (boardingId) => {
    try {
      const res = await axios.get(`http://localhost:5001/api/boardings/${boardingId}/waitlist`);
      setWaitlistData(res.data);
      setShowWaitlistModal(true);
    } catch (err) {
      alert("Failed to fetch waitlist.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-2 font-bold text-indigo-600 text-xl cursor-pointer hover:opacity-80 transition"
          >
            <Home size={24}/> <span>BoardingHub</span>
          </div>
          <div className="flex gap-2 md:gap-4 overflow-x-auto">
            <button onClick={() => setActiveTab('browse')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'browse' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
               Browse
            </button>
            <button onClick={() => { setActiveTab('add'); setEditingId(null); setFormData({ title: '', location: '', price: '', genderAllowed: 'Any', features: '', description: '' }); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              <PlusCircle size={18}/> Add Listing
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              <LayoutDashboard size={18}/> Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-4 relative">
        
        {/* VIEW 0: STUDENT BROWSE PAGE */}
        {activeTab === 'browse' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-md">Find Your Perfect Boarding</h1>
              <p className="text-indigo-100 text-base md:text-lg max-w-2xl mx-auto">Browse AI-verified listings exclusively for SLIIT students. Join the smart waitlist for high-demand locations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.length === 0 ? (
                <p className="text-center text-slate-500 col-span-full py-10">No boardings available yet.</p>
              ) : myListings.map(item => (
                <div key={item._id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  
                  <div className="h-48 bg-slate-100 relative border-b border-slate-100">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Home size={48} opacity={0.5} />
                    </div>
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black uppercase shadow-sm tracking-wide ${item.status === 'Available' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                    </div>
                    <p className="text-sm text-indigo-600 font-bold mb-4 flex items-center gap-1"><MapPin size={16}/> {item.location}</p>
                    
                    <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1 leading-relaxed">
                      <Sparkles size={14} className="inline text-indigo-400 mr-1"/>
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly</p>
                        <p className="text-xl font-black text-slate-900">Rs. {item.price}</p>
                      </div>
                      
                      {/* UPDATED: Notify Me triggers Waitlist */}
                      {item.status === 'Available' ? (
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md active:scale-95">
                          Contact
                        </button>
                      ) : (
                        <button 
                          onClick={() => joinWaitlist(item._id)}
                          className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 active:scale-95"
                        >
                          <Users size={16}/> Notify Me
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 1: ADD / EDIT LISTING PAGE */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Listing' : 'Create New Listing'}</h2>
                <p className="text-slate-500 text-sm">{editingId ? 'Update your existing details' : 'Fill in the details for SLIIT students'}</p>
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="text-sm font-bold text-slate-500 hover:text-red-500">
                  Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" value={formData.title} placeholder="Title" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <input type="text" value={formData.location} placeholder="Location" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, location: e.target.value})} />
                <input type="number" value={formData.price} placeholder="Monthly Price" className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                <select value={formData.genderAllowed} className="border p-3 rounded-xl outline-none bg-white" onChange={(e) => setFormData({...formData, genderAllowed: e.target.value})}>
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                </select>
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <label className="font-bold text-indigo-900 flex items-center gap-2 text-xs uppercase"><Sparkles size={16}/> AI Description Assistant</label>
                  <button type="button" onClick={generateAIDescription} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:shadow-lg transition">
                    {loadingAI ? "AI Writing..." : "Generate with AI"}
                  </button>
                </div>
                <input type="text" value={formData.features} placeholder="e.g. 5 min to SLIIT, WiFi, AC included" className="w-full p-3 rounded-xl border-none shadow-inner" onChange={(e) => setFormData({...formData, features: e.target.value})} />
              </div>
              <textarea rows="4" value={formData.description} placeholder="Final description..." className="w-full border p-4 rounded-xl outline-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
              
              {!editingId && (
                <input type="file" multiple className="text-sm text-slate-500" onChange={(e) => setImages([...e.target.files])} />
              )}
              
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition shadow-xl flex justify-center items-center gap-2">
                {editingId ? <><Edit2 size={20}/> Update Listing</> : 'Publish Listing'}
              </button>
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
                  
                  {/* UPDATED: Added View Waitlist Button */}
                  <div className="pt-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(item._id, item.status)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition shadow-md">
                        Mark as {item.status === 'Available' ? 'Full' : 'Available'}
                      </button>
                      <button onClick={() => handleEditClick(item)} className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-200 transition">
                        Edit
                      </button>
                      <button onClick={() => deleteListing(item._id)} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition">
                        Delete
                      </button>
                    </div>
                    
                    {item.status === 'Full' && (
                      <button onClick={() => viewWaitlist(item._id)} className="w-full py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-200 transition flex items-center justify-center gap-2">
                        <Users size={14}/> View Waitlist
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WAITLIST POPUP MODAL */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-indigo-600"/> Smart Waitlist</h3>
                <button onClick={() => setShowWaitlistModal(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {waitlistData.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 font-medium">No students on the waitlist yet.</p>
                ) : waitlistData.map((student, index) => (
                  <div key={student._id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-3 hover:shadow-sm transition">
                    <div className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{student.studentName}</p>
                      <p className="text-xs text-indigo-600 font-medium">{student.studentEmail}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Joined: {new Date(student.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;