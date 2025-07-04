import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// --- CONFIGURAÇÃO ---
// A URL da API é definida pela variável de ambiente REACT_APP_BACKEND_URL.
// Se não estiver definida, usa-se um valor padrão para desenvolvimento local.
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// --- ÍCONES (SVG) ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// --- CONTEXTO DE AUTENTICAÇÃO ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  const login = async (email, password) => {
    // Para OAuth2PasswordRequestForm, os dados devem ser enviados como form-data
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('scope', 'noivo convidado');

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha no login');
    }

    const data = await response.json();
    setToken(data.access_token);
    return data;
  };

  const logout = () => {
    setToken(null);
  };

  return (
      <AuthContext.Provider value={{ token, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTES DA UI ---

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          &times;
        </button>
        {children}
      </div>
    </div>
);

const GuestForm = ({ guest, onSave, onCancel, isLoading }) => {
  const [nome, setNome] = useState(guest?.nome || '');
  const [presenca, setPresenca] = useState(guest?.presenca || 'nao_confirmado');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert("O nome do convidado não pode estar vazio.");
      return;
    }
    onSave({ ...guest, nome, presenca });
  };

  return (
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-gray-700">{guest ? 'Editar Convidado' : 'Adicionar Convidado'}</h2>
        <div className="mb-4">
          <label htmlFor="nome" className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
          <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
          />
        </div>
        {guest && (
            <div className="mb-6">
              <label htmlFor="presenca" className="block text-gray-700 text-sm font-bold mb-2">Status da Presença</label>
              <select
                  id="presenca"
                  value={presenca}
                  onChange={(e) => setPresenca(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="nao_confirmado">Não Confirmado</option>
                <option value="vai">Vai</option>
                <option value="nao_vai">Não Vai</option>
              </select>
            </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-pink-300">
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
  );
};

const PresenceBadge = ({ status }) => {
  const styles = {
    vai: 'bg-green-100 text-green-800',
    nao_vai: 'bg-red-100 text-red-800',
    nao_confirmado: 'bg-yellow-100 text-yellow-800',
  };
  const text = {
    vai: 'Confirmado',
    nao_vai: 'Não virá',
    nao_confirmado: 'Pendente'
  }
  return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
      {text[status]}
    </span>
  );
};

const GuestItem = ({ guest, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
      <div>
        <p className="text-lg font-medium text-gray-800">{guest.nome}</p>
        <p className="text-sm text-gray-500">ID: {guest.convidado_id}</p>
      </div>
      <div className="flex items-center gap-4">
        <PresenceBadge status={guest.presenca} />
        <div className="flex gap-2">
          <button onClick={() => onEdit(guest)} className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-100">
            <EditIcon />
          </button>
          <button onClick={() => onDelete(guest)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
);


// --- PÁGINAS ---

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      // O App irá redirecionar automaticamente
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-center text-gray-800">Bem-vindo(a)!</h1>
          <p className="text-center text-gray-500">Faça login para gerenciar sua lista de convidados.</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-bold text-gray-600 block">Email</label>
              <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mt-1 border rounded-md focus:border-pink-400 focus:ring focus:ring-pink-300 focus:ring-opacity-50"
                  required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-bold text-gray-600 block">Senha</label>
              <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 mt-1 border rounded-md focus:border-pink-400 focus:ring focus:ring-pink-300 focus:ring-opacity-50"
                  required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 rounded-md text-white text-sm font-semibold transition-colors disabled:bg-pink-300">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

const GuestDashboard = () => {
  const [convidados, setConvidados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { token, logout } = useAuth();

  const fetchConvidados = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/convidados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Token inválido ou expirado
        }
        throw new Error('Não foi possível carregar os convidados.');
      }
      const data = await response.json();
      setConvidados(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchConvidados();
  }, [fetchConvidados]);

  const handleOpenModal = (guest = null) => {
    setEditingGuest(guest);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuest(null);
  };

  const handleSaveGuest = async (guestData) => {
    setIsSaving(true);
    const isUpdating = !!guestData.convidado_id;
    const url = isUpdating ? `${API_URL}/convidados/${guestData.convidado_id}` : `${API_URL}/convidados/`;
    const method = isUpdating ? 'PUT' : 'POST';

    // O schema do backend espera o `convidado_id` no corpo para PUT
    const body = JSON.stringify(guestData);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao salvar convidado.');
      }

      handleCloseModal();
      fetchConvidados(); // Recarrega a lista
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGuest = async (guest) => {
    if (window.confirm(`Tem certeza que deseja remover "${guest.nome}" da lista?`)) {
      try {
        const response = await fetch(`${API_URL}/convidados/${guest.convidado_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Falha ao deletar convidado.');
        }
        fetchConvidados(); // Recarrega a lista
      } catch (err) {
        alert(`Erro: ${err.message}`);
      }
    }
  };


  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Lista de Convidados</h1>
            <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-pink-600 font-medium transition-colors">
              <LogoutIcon/>
              Sair
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex justify-end">
              <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                <PlusIcon />
                Adicionar Convidado
              </button>
            </div>

            {isLoading && <p className="text-center text-gray-500">Carregando convidados...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-4">
                  {convidados.length > 0 ? (
                      convidados.map(guest => (
                          <GuestItem key={guest.convidado_id} guest={guest} onEdit={handleOpenModal} onDelete={handleDeleteGuest} />
                      ))
                  ) : (
                      <p className="text-center text-gray-500 mt-8">Nenhum convidado na lista ainda.</p>
                  )}
                </div>
            )}
          </div>
        </main>
        {isModalOpen && (
            <Modal onClose={handleCloseModal}>
              <GuestForm guest={editingGuest} onSave={handleSaveGuest} onCancel={handleCloseModal} isLoading={isSaving} />
            </Modal>
        )}
      </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  return (
      <AuthProvider>
        <MainApp />
      </AuthProvider>
  );
}

function MainApp() {
  const { token } = useAuth();
  return token ? <GuestDashboard /> : <LoginPage />;
}
