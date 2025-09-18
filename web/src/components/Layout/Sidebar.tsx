import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, Users, MapPin, Megaphone, Settings, X, LogOut, Wheat, UserCheck, Bell, Building2 } from 'lucide-react';
import { Button } from '../ui/button';

// Type assertions pour résoudre le conflit de types
const BarChart3Icon = BarChart3 as any;
const UsersIcon = Users as any;
const MapPinIcon = MapPin as any;
const MegaphoneIcon = Megaphone as any;
const SettingsIcon = Settings as any;
const XIcon = X as any;
const LogOutIcon = LogOut as any;
const WheatIcon = Wheat as any;
const UserCheckIcon = UserCheck as any;
const BellIcon = Bell as any;
const Building2Icon = Building2 as any;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: BarChart3Icon, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Building2Icon, label: 'Coopératives', path: '/cooperatives' },
    { icon: UsersIcon, label: 'Producteurs', path: '/producers' },
    { icon: UserCheckIcon, label: 'Agents', path: '/agents' },
    { icon: MapPinIcon, label: 'Parcelles & Cultures', path: '/plots' },
    { icon: BellIcon, label: 'Alertes & Recommandations', path: '/alerts' },
    { icon: SettingsIcon, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none
      `}>
        <div className="flex flex-col h-screen lg:h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <WheatIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AgriConnect</h2>
                <p className="text-xs text-gray-500">Superviseur</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${isActive 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => {
                    // Fermer la sidebar sur mobile après clic
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOutIcon className="h-4 w-4 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;