import React, { useState, useEffect, useRef } from 'react';
import { Box, Item, ViewState, Location, User } from './types';
import { getBoxes, getItems, deleteBox, checkAndSeedData, saveBox, compressImage, saveItem, deleteItem, generateId, getLocations, saveLocation, deleteLocation } from './services/storage';
import { askInventoryAssistant, analyzeImage, searchPlaceWithMaps } from './services/geminiService';
import { Button, Icons, Badge, Card, Timeline, Lightbox, Input, TextArea } from './components/UI';

// --- View: Login ---

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Simulate network delay for realistic feel
        setTimeout(() => {
            onLogin();
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-md w-full bg-[#0f111a] border border-gray-800 rounded-2xl shadow-2xl p-8 text-center relative z-10 animate-fade-in-up">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-6">
                    <Icons.Logo />
                </div>
                
                <h1 className="text-3xl font-bold text-white brand-font mb-2">Bienvenido a Bártulos</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    Gestiona tu inventario personal, organiza tus cajas y encuentra cualquier objeto con el poder de la Inteligencia Artificial.
                </p>

                <div className="space-y-4">
                    <Button 
                        variant="white" 
                        onClick={handleGoogleLogin} 
                        className="w-full !py-3.5 !text-base relative overflow-hidden"
                        disabled={isLoading}
                        icon={!isLoading ? <Icons.Google /> : undefined}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                                Iniciando sesión...
                            </span>
                        ) : "Continuar con Google"}
                    </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
                        <br/>
                        <span className="opacity-50 mt-2 block">(Modo Demo: No se requieren credenciales reales)</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Components: Navigation ---

const Navbar: React.FC<{ 
  user: User | null,
  onLogout: () => void,
  onNavigateHome: () => void,
  onNavigateLocations: () => void,
  currentLabel?: string
}> = ({ user, onLogout, onNavigateHome, onNavigateLocations, currentLabel }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-8 justify-between shadow-lg shadow-black/20">
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={onNavigateHome}
      >
        <div className="text-primary-500 transition-transform group-hover:scale-110 duration-300">
            <Icons.Logo />
        </div>
        <span className="font-bold text-lg md:text-xl tracking-wider text-white brand-font group-hover:text-primary-400 transition-colors">BÁRTULOS</span>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs font-mono tracking-widest text-gray-500">
        <button 
            onClick={onNavigateHome}
            className="hover:text-white transition-colors flex items-center gap-2 px-3 py-1 rounded-md hover:bg-white/5"
        >
            <Icons.Home />
            INICIO
        </button>
        <button 
            onClick={onNavigateLocations}
            className="hover:text-white transition-colors flex items-center gap-2 px-3 py-1 rounded-md hover:bg-white/5"
        >
            <Icons.MapPin />
            LUGARES
        </button>
        {currentLabel && (
            <>
                <span className="text-gray-700">/</span>
                <span className="text-primary-400 font-bold bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 max-w-[200px] truncate">
                    {currentLabel}
                </span>
            </>
        )}
      </div>

      <div className="flex items-center gap-4">
         <div className="md:hidden flex gap-2">
            <button 
                className="p-2 text-gray-400 hover:text-white active:scale-95 transition-transform" 
                onClick={onNavigateHome}
            >
                <Icons.Home />
            </button>
            <button 
                className="p-2 text-gray-400 hover:text-white active:scale-95 transition-transform" 
                onClick={onNavigateLocations}
            >
                <Icons.MapPin />
            </button>
         </div>
         
         {user && (
             <div className="flex items-center gap-3 pl-4 md:border-l border-white/10">
                 <div className="hidden md:block text-right">
                     <div className="text-xs font-bold text-white leading-none mb-1">{user.name}</div>
                     <div className="text-[10px] text-gray-500 font-mono leading-none">{user.email}</div>
                 </div>
                 <div className="relative group cursor-pointer">
                    <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full border border-white/10 shadow-inner object-cover" 
                    />
                    <div className="absolute top-10 right-0 w-48 bg-[#0f111a] border border-gray-700 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform origin-top-right z-50">
                        <div className="px-4 py-3 border-b border-gray-800 md:hidden">
                            <p className="text-white text-sm font-bold">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                        >
                            <Icons.Logout /> Cerrar Sesión
                        </button>
                    </div>
                 </div>
             </div>
         )}
      </div>
    </nav>
  );
}

// --- Component: AI Chat Assistant ---

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([
      {role: 'model', text: 'Hola. Soy la IA de Bártulos. ¿Qué necesitas encontrar hoy?'}
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isThinking) return;

      const userMsg = input;
      setInput('');
      setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsThinking(true);

      const contextData = {
          items: getItems(),
          boxes: getBoxes(),
          locations: getLocations()
      };

      const response = await askInventoryAssistant(userMsg, history, contextData);
      
      setHistory(prev => [...prev, { role: 'model', text: response }]);
      setIsThinking(false);
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-500 text-white p-4 rounded-full shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-transform hover:scale-110 active:scale-95 border border-primary-400/30"
          >
              <Icons.Sparkles />
          </button>
      );
  }

  return (
      <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[500px] bg-[#0f111a] border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-gradient-to-r from-primary-900/50 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Icons.Sparkles />
                  <span className="font-bold text-white brand-font">Bártulos AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><Icons.X /></button>
          </div>
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-black/20">
              {history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                          msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'
                      }`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
              {isThinking && (
                  <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-2xl rounded-bl-none p-3 flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                      </div>
                  </div>
              )}
          </div>
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700 bg-gray-900">
              <div className="relative">
                  <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Pregunta sobre tu inventario..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button type="submit" disabled={!input.trim() || isThinking} className="absolute right-2 top-1.5 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-500 disabled:opacity-50 disabled:bg-gray-700"><Icons.Send /></button>
              </div>
          </form>
      </div>
  );
};

// --- Component: Location Editor Modal ---

const LocationEditorModal: React.FC<{
    location?: Location; 
    onClose: () => void;
    onSave: () => void;
}> = ({ location, onClose, onSave }) => {
    const [name, setName] = useState(location?.name || '');
    const [description, setDescription] = useState(location?.description || '');
    const [address, setAddress] = useState(location?.address || '');
    const [photoUrl, setPhotoUrl] = useState(location?.photoUrl || '');
    const [googleMapsUri, setGoogleMapsUri] = useState(location?.googleMapsUri || '');
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await compressImage(file);
            setPhotoUrl(base64);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMapSearch = async () => {
        if (!name && !address) return;
        setIsSearchingMap(true);
        const query = address || name;
        const result = await searchPlaceWithMaps(query);
        if (result) {
            if (result.address && !address) setAddress(result.address);
            if (result.uri) setGoogleMapsUri(result.uri);
        }
        setIsSearchingMap(false);
    };

    const handleSubmit = () => {
        if (!name) return;
        const newLocation: Location = {
            id: location?.id || generateId(),
            name,
            description,
            address,
            googleMapsUri,
            photoUrl
        };
        saveLocation(newLocation);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f111a] border border-gray-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-lg font-bold text-white brand-font">{location ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"><Icons.X /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Photo Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-white/5 transition-all overflow-hidden relative group"
                    >
                        {photoUrl ? (
                            <img src={photoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 group-hover:text-primary-400">
                                <Icons.Camera />
                                <span className="text-xs mt-2">Agregar foto del lugar</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre del Lugar</label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Sótano, Oficina, Garage..." />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descripción</label>
                        <TextArea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descripción breve..." />
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                         <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-bold text-primary-400 uppercase flex items-center gap-1">
                                <Icons.MapPin /> Google Maps Grounding
                            </label>
                            {googleMapsUri && (
                                <a href={googleMapsUri} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 underline hover:text-blue-300">Ver en Google Maps</a>
                            )}
                         </div>
                         <div className="flex gap-2">
                            <Input 
                                value={address} 
                                onChange={e => setAddress(e.target.value)} 
                                placeholder="Dirección o referencia" 
                                className="!bg-black/20"
                            />
                            <Button 
                                type="button" 
                                variant="secondary" 
                                className="!px-3"
                                onClick={handleMapSearch}
                                disabled={isSearchingMap || (!name && !address)}
                            >
                                {isSearchingMap ? <span className="animate-spin text-primary-500">⟳</span> : <Icons.Search />}
                            </Button>
                         </div>
                         <p className="text-[9px] text-gray-500 mt-2 leading-tight">
                            La IA buscará la dirección exacta y el enlace a Maps.
                         </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800 bg-gray-900/30 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>CANCELAR</Button>
                    <Button variant="primary" onClick={handleSubmit}>GUARDAR</Button>
                </div>
            </div>
        </div>
    );
};

// --- View: Locations Manager ---

const LocationsManagerView: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [editingLoc, setEditingLoc] = useState<Location | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setLocations(getLocations());
    }, [isCreating, editingLoc]); // Refresh trigger

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar esta ubicación? Las cajas asociadas quedarán sin asignar.")) {
            deleteLocation(id);
            setLocations(getLocations());
        }
    };

    return (
        <>
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in pb-24">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <Button variant="ghost" onClick={onBack} className="!px-0 !pl-0 text-gray-400 hover:text-white mb-2 gap-1 text-xs">
                         <span className="rotate-180 inline-block"><Icons.ChevronRight /></span> VOLVER
                    </Button>
                    <h2 className="text-2xl font-bold text-white brand-font">Mis Ubicaciones</h2>
                    <p className="text-gray-400 text-sm mt-1">Gestiona las zonas de almacenamiento de tu hogar</p>
                </div>
                <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsCreating(true)}>
                    NUEVO LUGAR
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map(loc => (
                    <Card key={loc.id} className="group relative hover:border-primary-500/50 transition-colors">
                        <div className="h-40 bg-gray-900 overflow-hidden relative border-b border-gray-800">
                            {loc.photoUrl ? (
                                <img src={loc.photoUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-800"><Icons.MapPin /></div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button 
                                    onClick={() => setEditingLoc(loc)}
                                    className="p-1.5 bg-black/60 hover:bg-primary-600 text-white rounded backdrop-blur-sm transition-colors"
                                >
                                    <Icons.Pencil />
                                </button>
                                <button 
                                    onClick={() => handleDelete(loc.id)}
                                    className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded backdrop-blur-sm transition-colors"
                                >
                                    <Icons.Trash />
                                </button>
                            </div>
                            {loc.googleMapsUri && (
                                <a 
                                    href={loc.googleMapsUri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md flex items-center gap-1 hover:bg-blue-600 transition-colors"
                                >
                                    <Icons.MapPin />
                                    Ver en Mapa
                                </a>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-lg">{loc.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[40px]">{loc.description || "Sin descripción"}</p>
                            {loc.address && (
                                <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400 flex items-start gap-1">
                                    <span className="shrink-0 mt-0.5"><Icons.MapPin /></span>
                                    <span className="truncate">{loc.address}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
            
            {locations.length === 0 && (
                <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-surface/30">
                    <div className="inline-block p-4 bg-gray-900 rounded-full mb-4 text-gray-600"><Icons.MapPin /></div>
                    <p className="text-gray-400">No tienes ubicaciones registradas.</p>
                    <p className="text-xs text-gray-600 mt-1">Crea zonas como "Garage", "Ático" o "Oficina" para organizar tus cajas.</p>
                </div>
            )}
        </div>

        {(isCreating || editingLoc) && (
            <LocationEditorModal 
                location={editingLoc || undefined}
                onClose={() => {
                    setIsCreating(false);
                    setEditingLoc(null);
                }}
                onSave={() => {
                    setLocations(getLocations()); // Force refresh
                }}
            />
        )}
        </>
    );
};

// --- Component: Item Detail Modal ---
// (Unchanged)
const ItemDetailModal: React.FC<{
    item: Item;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}> = ({ item, onClose, onUpdate, onDelete }) => {
    // Basic Fields
    const [name, setName] = useState(item.name);
    const [description, setDescription] = useState(item.description);
    const [tags, setTags] = useState(item.tags.join(', '));
    const [activeTab, setActiveTab] = useState<'EDIT' | 'MOVE' | 'LOAN'>('EDIT');
    const [photos, setPhotos] = useState<string[]>(item.photoUrls || (item.photoUrl ? [item.photoUrl] : []));
    
    // Move Logic
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [targetBoxId, setTargetBoxId] = useState('');

    // Loan Logic
    const [borrowerName, setBorrowerName] = useState('');
    
    // Photo Logic
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        setBoxes(getBoxes().filter(b => b.id !== item.boxId));
    }, [item.boxId]);

    const handleSaveDetails = () => {
        const updatedItem: Item = {
            ...item,
            name,
            description,
            photoUrls: photos,
            photoUrl: photos[0], // Keep backward compatibility
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            history: [
                ...item.history,
                { date: Date.now(), type: 'EDIT', details: 'Actualización de detalles' }
            ]
        };
        saveItem(updatedItem);
        onUpdate();
        onClose();
    };

    const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await compressImage(file);
            setPhotos(prev => [base64, ...prev]); // Add new photo to start
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        if(confirm("¿Eliminar esta foto?")) {
            setPhotos(prev => prev.filter((_, i) => i !== indexToRemove));
        }
    };

    const handleMove = () => {
        if (!targetBoxId) return;
        const targetBox = boxes.find(b => b.id === targetBoxId);
        const updatedItem: Item = {
            ...item,
            boxId: targetBoxId,
            history: [
                ...item.history,
                { date: Date.now(), type: 'MOVE', details: `Trasladado a caja: ${targetBox?.name || 'Desconocida'}` }
            ]
        };
        saveItem(updatedItem);
        onUpdate(); 
        onClose();
    };

    const handleLoan = () => {
        if (!borrowerName) return;
        const updatedItem: Item = {
            ...item,
            loan: {
                isLoaned: true,
                borrowerName,
                loanDate: Date.now()
            },
            history: [
                ...item.history,
                { date: Date.now(), type: 'LOAN', details: `Prestado a ${borrowerName}` }
            ]
        };
        saveItem(updatedItem);
        onUpdate();
        onClose();
    };

    const handleReturn = () => {
        const updatedItem: Item = {
            ...item,
            loan: { isLoaned: false },
            history: [
                ...item.history,
                { date: Date.now(), type: 'RETURN', details: 'Objeto devuelto' }
            ]
        };
        saveItem(updatedItem);
        onUpdate();
        onClose();
    };

    const handleDelete = () => {
        if (confirm("¿Estás seguro de eliminar este objeto permanentemente?")) {
            onDelete();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f111a] border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-white brand-font truncate pr-4 max-w-[250px]">{item.name}</h3>
                        {item.loan.isLoaned && <Badge color="yellow">PRESTADO</Badge>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"><Icons.X /></button>
                </div>

                {/* Photo Gallery - Always Visible */}
                <div className="p-4 bg-gray-900/30 border-b border-gray-800 overflow-x-auto no-scrollbar">
                    <div className="flex gap-3">
                        {/* Add Photo Button */}
                        <button 
                            onClick={() => photoInputRef.current?.click()}
                            className="w-20 h-20 flex-shrink-0 rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-primary-500 hover:bg-primary-500/10 transition-all"
                        >
                            <Icons.Camera />
                            <span className="text-[9px] mt-1 font-bold">AÑADIR</span>
                        </button>
                        <input type="file" className="hidden" ref={photoInputRef} accept="image/*" onChange={handleAddPhoto} />

                        {/* Photos */}
                        {photos.map((url, idx) => (
                            <div key={idx} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-800 relative group">
                                <img 
                                    src={url} 
                                    className="w-full h-full object-cover cursor-pointer" 
                                    onClick={() => setLightboxIndex(idx)}
                                />
                                <button 
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <Icons.X />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-900/30">
                    <button 
                        onClick={() => setActiveTab('EDIT')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'EDIT' ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Detalles
                    </button>
                    <button 
                        onClick={() => setActiveTab('MOVE')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'MOVE' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Mover
                    </button>
                    <button 
                        onClick={() => setActiveTab('LOAN')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'LOAN' ? 'text-yellow-400 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Préstamo
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-grow">
                    
                    {activeTab === 'EDIT' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre del Objeto</label>
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <TextArea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Etiquetas</label>
                                <Input value={tags} onChange={e => setTags(e.target.value)} />
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <button onClick={handleDelete} className="text-red-400 text-xs hover:text-red-300 hover:underline">Eliminar objeto</button>
                                <Button variant="primary" onClick={handleSaveDetails} icon={<Icons.Check />}>GUARDAR CAMBIOS</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'MOVE' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icons.Exchange />
                            </div>
                            <h4 className="text-white font-bold">Mover a otra caja</h4>
                            <p className="text-sm text-gray-500">Selecciona el nuevo destino para este objeto.</p>
                            
                            <div className="mt-4">
                                <select 
                                    className="w-full bg-surfaceHighlight border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-primary-500 appearance-none"
                                    value={targetBoxId}
                                    onChange={(e) => setTargetBoxId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar caja destino --</option>
                                    {boxes.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <Button 
                                variant="primary" 
                                className="w-full mt-4 !bg-blue-600 hover:!bg-blue-500" 
                                onClick={handleMove}
                                disabled={!targetBoxId}
                            >
                                CONFIRMAR TRASLADO
                            </Button>
                        </div>
                    )}

                    {activeTab === 'LOAN' && (
                        <div className="space-y-4 py-2">
                            {item.loan.isLoaned ? (
                                <div className="text-center bg-yellow-900/10 border border-yellow-900/30 rounded-lg p-6">
                                    <h4 className="text-yellow-500 font-bold mb-1">OBJETO PRESTADO</h4>
                                    <p className="text-gray-400 text-sm mb-6">Actualmente en posesión de:</p>
                                    <div className="text-2xl text-white font-mono mb-6">{item.loan.borrowerName}</div>
                                    <Button variant="primary" className="w-full !bg-green-600 hover:!bg-green-500 border-none" onClick={handleReturn}>
                                        MARCAR COMO DEVUELTO
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">Registra un préstamo para saber quién tiene tus cosas.</p>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre de la persona</label>
                                        <Input 
                                            value={borrowerName} 
                                            onChange={e => setBorrowerName(e.target.value)} 
                                            placeholder="Ej: Juan Pérez" 
                                            autoFocus
                                        />
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className="w-full !bg-yellow-600 hover:!bg-yellow-500 text-black border-none font-bold" 
                                        onClick={handleLoan}
                                        disabled={!borrowerName}
                                    >
                                        REGISTRAR PRÉSTAMO
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
            {lightboxIndex !== null && (
                <Lightbox 
                    images={photos} 
                    initialIndex={lightboxIndex} 
                    onClose={() => setLightboxIndex(null)} 
                />
            )}
        </div>
    );
};

// --- Component: Add Item Modal (AI Powered) ---
// (Unchanged)
const AddItemModal: React.FC<{
    boxId: string;
    onClose: () => void;
    onSave: () => void;
}> = ({ boxId, onClose, onSave }) => {
    const [step, setStep] = useState<'PHOTO' | 'DETAILS'>('PHOTO');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. Show Preview
            const base64 = await compressImage(file);
            setImagePreview(base64);
            setStep('DETAILS');
            setIsAnalyzing(true);

            // 2. AI Analysis
            const analysis = await analyzeImage(base64);
            
            // 3. Fill Form
            setName(analysis.name);
            setDescription(analysis.description);
            setTags(analysis.tags.join(', '));
        } catch (error) {
            console.error(error);
            // Fallback if AI fails, user still sees form
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: Item = {
            id: generateId(),
            boxId,
            name: name || 'Objeto sin nombre',
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            photoUrl: imagePreview || undefined, // Legacy compat
            photoUrls: imagePreview ? [imagePreview] : [],
            createdAt: Date.now(),
            loan: { isLoaned: false },
            history: [{ date: Date.now(), type: 'CREATE', details: 'Objeto registrado con IA' }]
        };
        saveItem(newItem);
        onSave();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f111a] border border-gray-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {step === 'PHOTO' ? <Icons.Camera /> : <Icons.Sparkles />}
                        {step === 'PHOTO' ? 'Escanear Objeto' : 'Detalles del Objeto'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icons.X /></button>
                </div>

                {step === 'PHOTO' ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-40 h-40 rounded-full border-2 border-dashed border-primary-500/50 flex items-center justify-center bg-primary-500/10 cursor-pointer hover:bg-primary-500/20 hover:scale-105 transition-all group"
                        >
                            <div className="text-primary-500 group-hover:text-primary-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                        <div>
                            <h4 className="text-white font-bold text-lg">Tomar Foto</h4>
                            <p className="text-gray-500 text-sm mt-1">La IA analizará la imagen automáticamente.</p>
                        </div>
                        <button onClick={() => setStep('DETAILS')} className="text-xs text-gray-500 underline hover:text-gray-300">
                            Saltar y agregar manualmente
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-24 h-24 bg-gray-900 rounded-lg border border-gray-800 flex-shrink-0 overflow-hidden relative">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600"><Icons.Box /></div>
                                )}
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                {isAnalyzing ? (
                                    <div className="h-full flex flex-col justify-center space-y-2 animate-pulse">
                                        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                                        <p className="text-xs text-primary-400 font-mono mt-2">✨ Analizando imagen...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                            <Input 
                                                value={name} 
                                                onChange={e => setName(e.target.value)} 
                                                placeholder="Nombre del objeto" 
                                                required 
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                            <TextArea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder={isAnalyzing ? "Generando descripción..." : "Detalles sobre el objeto..."}
                                rows={2}
                                disabled={isAnalyzing}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etiquetas</label>
                            <Input 
                                value={tags} 
                                onChange={e => setTags(e.target.value)} 
                                placeholder={isAnalyzing ? "Generando tags..." : "Etiquetas separadas por coma"}
                                disabled={isAnalyzing}
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">CANCELAR</Button>
                            <Button type="submit" variant="primary" className="flex-1" disabled={isAnalyzing}>GUARDAR</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- View: Box Detail View ---
// (Unchanged)
const BoxDetailView: React.FC<{ 
  box: Box, 
  onBack: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onViewItem: (item: Item) => void,
  onBoxUpdated: (box: Box) => void
}> = ({ box, onBack, onEdit, onDelete, onViewItem, onBoxUpdated }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshItems = () => {
      setItems(getItems().filter(i => i.boxId === box.id));
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      refreshItems();
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [box.id]);

  const handleDelete = () => {
    if (confirm(`¿PROTOCOL DELETE: Eliminar contenedor "${box.code}" y sus ${items.length} objetos asociados?`)) {
      onDelete();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const optimizedImage = await compressImage(file);
      const updatedBox: Box = {
        ...box,
        photoUrl: optimizedImage,
        history: [
          ...box.history,
          { date: Date.now(), type: 'EDIT', details: 'Fotografía actualizada' }
        ]
      };
      saveBox(updatedBox);
      onBoxUpdated(updatedBox);
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Error al procesar la imagen.");
    }
  };

  const triggerCamera = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    fileInputRef.current?.click();
  };

  return (
    <>
    <div className="p-4 md:p-8 space-y-6 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Breadcrumb Mobile only */}
      <div className="md:hidden flex items-center gap-2 text-xs font-mono text-gray-500 mb-2">
         <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors">
            <Icons.Home /> INICIO
         </button>
         <span>/</span>
         <span className="text-primary-400 font-bold truncate">{box.name}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="!px-0 !pl-0 text-gray-400 hover:text-white gap-2 group">
            <span className="bg-surfaceHighlight p-1.5 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            </span>
            <span className="hidden sm:inline">VOLVER AL LISTADO</span>
        </Button>
        <Button variant="secondary" onClick={onEdit} icon={<Icons.Pencil />} className="px-3 py-2 text-xs">EDITAR DATOS</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 space-y-4">
          <div 
            className="aspect-video w-full bg-surfaceHighlight rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative group cursor-zoom-in"
            onClick={() => box.photoUrl && setIsLightboxOpen(true)}
          >
            {box.photoUrl ? (
              <>
                <img src={box.photoUrl} alt={box.code} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-black/50 p-3 rounded-full text-white backdrop-blur-sm pointer-events-none">
                        <Icons.ZoomIn />
                    </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-700"><Icons.Box /></div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-6 pointer-events-none">
              <div className="flex-grow">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Identificador</p>
                  <span className="text-white font-bold text-3xl font-mono tracking-tighter">{box.code}</span>
              </div>
            </div>

            <button 
                onClick={triggerCamera}
                className="absolute top-3 right-3 bg-black/60 hover:bg-primary-600 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg z-10 group/cam"
                title="Cambiar foto"
            >
                <Icons.Camera />
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
            />
          </div>

          <div className="mt-8">
            <Timeline history={box.history} />
          </div>

          <div className="mt-4 hidden lg:block">
            <div className="bg-surface border border-gray-800 p-6 rounded-xl">
               <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-widest mb-3">Acciones de Contenedor</h3>
                <Button variant="secondary" className="w-full mb-3" onClick={triggerCamera} icon={<Icons.Camera />}>
                    CAMBIAR FOTO DE PORTADA
                </Button>
                <Button variant="danger" className="w-full" onClick={handleDelete} icon={<Icons.Trash />}>
                    ELIMINAR CAJA PERMANENTEMENTE
                </Button>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white brand-font leading-tight">{box.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge color="brand">{box.code}</Badge>
                <Badge color="gray">{items.length} OBJETOS</Badge>
              </div>
            </div>

            <div className="bg-surface border border-gray-800 p-4 rounded-xl flex items-center gap-4">
               <div className="p-3 bg-gray-900 rounded-lg text-gray-400">
                  <Icons.MapPin />
               </div>
               <div>
                  <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-widest mb-0.5">Ubicación Actual</h3>
                  <p className="font-medium text-lg text-white font-mono">{box.location}</p>
               </div>
            </div>

            {box.description && (
              <div className="bg-surface border border-gray-800 p-6 rounded-xl">
                <h3 className="font-bold text-gray-500 text-[10px] uppercase tracking-widest mb-2">Descripción General</h3>
                <p className="text-gray-300 leading-relaxed text-sm">{box.description}</p>
              </div>
            )}

            <div className="hidden lg:flex justify-end">
               <Button variant="danger" onClick={handleDelete} icon={<Icons.Trash />}>
                  ELIMINAR CAJA
               </Button>
            </div>

            <div>
               <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
                    <h3 className="font-bold text-white text-sm uppercase tracking-widest">Contenido del Baúl</h3>
                    <button 
                        onClick={() => setIsAddItemOpen(true)}
                        className="text-xs flex items-center gap-1 bg-primary-600/20 text-primary-400 px-2 py-1 rounded hover:bg-primary-600 hover:text-white transition-colors"
                    >
                        <Icons.Plus /> AGREGAR OBJETO
                    </button>
               </div>
               
               {isLoading ? (
                 <div className="py-12 flex flex-col items-center justify-center space-y-3 text-gray-500 border border-gray-800/50 rounded-lg bg-surface/50">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono uppercase tracking-widest animate-pulse">Cargando inventario...</span>
                 </div>
               ) : (
                 <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   {items.map(item => {
                      const thumb = item.photoUrls?.[0] || item.photoUrl;
                      return (
                        <Card key={item.id} onClick={() => setSelectedItem(item)} className="p-2 flex items-center gap-3 hover:bg-white/5 cursor-pointer group/item">
                          <div className="w-10 h-10 rounded bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-800">
                             {thumb ? <img src={thumb} className="w-full h-full object-cover"/> : <div className="p-2 text-gray-600"><Icons.Box /></div>}
                          </div>
                          <div className="flex-grow min-w-0">
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-200 truncate">{item.name}</p>
                                {item.loan.isLoaned && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                             </div>
                             <div className="flex gap-1 overflow-hidden mt-0.5">
                                {item.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-[9px] bg-gray-800 text-gray-500 px-1 rounded">{tag}</span>
                                ))}
                             </div>
                          </div>
                          <div className="flex items-center gap-2 pr-2">
                             <div className="text-gray-600">
                                <Icons.ChevronRight />
                             </div>
                          </div>
                        </Card>
                      );
                   })}
                   {items.length === 0 && (
                     <div className="text-center py-8 text-gray-600 font-mono text-sm border border-dashed border-gray-800 rounded-lg">
                       >> CONTENEDOR VACÍO
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="pt-4 lg:hidden space-y-3">
              <Button variant="secondary" className="w-full" onClick={triggerCamera} icon={<Icons.Camera />}>
                 CAMBIAR FOTO DE PORTADA
              </Button>
              <Button variant="danger" className="w-full" onClick={handleDelete} icon={<Icons.Trash />}>
                ELIMINAR CAJA
              </Button>
            </div>
        </div>
      </div>
    </div>

    {isLightboxOpen && box.photoUrl && (
        <Lightbox 
            images={[box.photoUrl]} 
            onClose={() => setIsLightboxOpen(false)} 
        />
    )}

    {isAddItemOpen && (
        <AddItemModal 
            boxId={box.id} 
            onClose={() => setIsAddItemOpen(false)} 
            onSave={() => {
                setIsAddItemOpen(false);
                refreshItems();
            }} 
        />
    )}

    {selectedItem && (
        <ItemDetailModal 
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={refreshItems}
            onDelete={() => {
                deleteItem(selectedItem.id);
                setSelectedItem(null);
                refreshItems();
            }}
        />
    )}
    </>
  );
};

// --- View: Dashboard ---

const DashboardView: React.FC<{ 
  onSelectBox: (box: Box) => void,
  dataVersion: number
}> = ({ onSelectBox, dataVersion }) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string>('ALL');

  useEffect(() => {
    setBoxes(getBoxes());
    setLocations(getLocations());
  }, [dataVersion]); 

  // Filter Logic
  const filteredBoxes = activeFilterId === 'ALL' 
    ? boxes 
    : boxes.filter(b => b.locationId === activeFilterId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white brand-font">Mis Contenedores</h2>
            <p className="text-gray-400 text-sm mt-1">Gestiona el inventario de tu hogar</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />}>
            NUEVA CAJA
        </Button>
      </div>

      {/* Location Filters Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        <button
            onClick={() => setActiveFilterId('ALL')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeFilterId === 'ALL' 
                ? 'bg-white text-black border-white' 
                : 'bg-surface border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
        >
            TODOS
        </button>
        {locations.map(loc => (
             <button
                key={loc.id}
                onClick={() => setActiveFilterId(loc.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                    activeFilterId === loc.id 
                    ? 'bg-primary-600 text-white border-primary-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]' 
                    : 'bg-surface border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
            >
                {loc.name}
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[9px]">
                    {boxes.filter(b => b.locationId === loc.id).length}
                </span>
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBoxes.map(box => (
          <Card key={box.id} onClick={() => onSelectBox(box)} className="p-0 cursor-pointer hover:border-primary-500 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 h-full flex flex-col">
            <div className="h-32 bg-gray-900 relative overflow-hidden">
                {box.photoUrl ? (
                    <img src={box.photoUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Icons.Box />
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge color="brand">{box.code}</Badge>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-white truncate text-lg">{box.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 mb-3">
                    <Icons.MapPin /> {box.location}
                </p>
                <div className="mt-auto pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-mono">Ver detalles</span>
                    <Icons.ChevronRight />
                </div>
            </div>
          </Card>
        ))}
        {filteredBoxes.length === 0 && (
             <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl bg-surface/30">
                 <div className="p-4 bg-gray-900 rounded-full mb-4">
                    <Icons.Box />
                 </div>
                 <p className="font-medium text-lg text-white">No hay cajas en esta ubicación</p>
                 <p className="text-sm mb-6">Cambia el filtro o agrega una nueva caja.</p>
                 <Button variant="primary" icon={<Icons.Plus />}>
                    CREAR CAJA
                </Button>
             </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [currentBox, setCurrentBox] = useState<Box | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    // 1. Data Seeding
    const seeded = checkAndSeedData();
    if (seeded) {
        console.log("Datos dummy generados correctamente.");
        setDataVersion(v => v + 1);
    }
    
    // 2. Auth Check
    const storedUser = localStorage.getItem('bartulos_user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }

    setIsInitialized(true);
  }, []);

  const handleLogin = () => {
      // Simulate Google Auth
      const dummyUser: User = {
          id: 'u_123456',
          name: 'Demo User',
          email: 'usuario@demo.com',
          avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix' 
      };
      localStorage.setItem('bartulos_user', JSON.stringify(dummyUser));
      setUser(dummyUser);
  };

  const handleLogout = () => {
      localStorage.removeItem('bartulos_user');
      setUser(null);
      setView(ViewState.DASHBOARD);
  };

  const handleBoxSelect = (box: Box) => {
    setCurrentBox(box);
    setView(ViewState.BOX_DETAILS);
  };

  const handleNavigateHome = () => {
    setCurrentBox(null);
    setView(ViewState.DASHBOARD);
  };

  const handleDeleteBox = () => {
    if (currentBox) {
      deleteBox(currentBox.id);
      setCurrentBox(null);
      setDataVersion(v => v + 1); 
      setView(ViewState.DASHBOARD);
    }
  };

  const handleBoxUpdated = (updatedBox: Box) => {
    setCurrentBox(updatedBox);
    setDataVersion(v => v + 1);
  };

  if (!isInitialized) {
      return (
          <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-gray-500 gap-4">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono uppercase tracking-widest animate-pulse">Iniciando Sistema...</p>
          </div>
      );
  }

  // Auth Guard
  if (!user) {
      return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch(view) {
      case ViewState.LOCATIONS:
          return <LocationsManagerView onBack={() => setView(ViewState.DASHBOARD)} />;
      case ViewState.BOX_DETAILS:
        return currentBox ? (
          <BoxDetailView 
            box={currentBox} 
            onBack={() => setView(ViewState.DASHBOARD)}
            onEdit={() => {}}
            onDelete={handleDeleteBox}
            onViewItem={(item) => console.log('View item', item)} 
            onBoxUpdated={handleBoxUpdated}
          />
        ) : <DashboardView onSelectBox={handleBoxSelect} dataVersion={dataVersion} />;
      default:
        return <DashboardView onSelectBox={handleBoxSelect} dataVersion={dataVersion} />;
    }
  };

  let navLabel = undefined;
  if (view === ViewState.BOX_DETAILS && currentBox) {
      navLabel = currentBox.name;
  } else if (view === ViewState.LOCATIONS) {
      navLabel = 'Gestión de Lugares';
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-primary-500/30">
       <Navbar 
            user={user}
            onLogout={handleLogout}
            onNavigateHome={handleNavigateHome} 
            onNavigateLocations={() => setView(ViewState.LOCATIONS)}
            currentLabel={navLabel} 
       />
       <main className="pt-16">
          {renderView()}
       </main>
       <AIChatAssistant />
    </div>
  );
}