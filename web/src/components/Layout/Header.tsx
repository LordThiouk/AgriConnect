import React from 'react';
import { Menu, Search, Bell, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Type assertions pour résoudre le conflit de types
const MenuIcon = Menu as any;
const SearchIcon = Search as any;
const BellIcon = Bell as any;
const PlusIcon = Plus as any;
const DownloadIcon = Download as any;
const RefreshCwIcon = RefreshCw as any;

interface HeaderProps {
  onMenuToggle: () => void;
  userName?: string;
  userRole?: string;
  pageTitle?: string;
  pageDescription?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  showExportButton?: boolean;
  onExportClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  userName, 
  userRole,
  pageTitle,
  pageDescription,
  showAddButton,
  addButtonText,
  onAddClick,
  showExportButton,
  onExportClick
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {pageTitle || 'Dashboard National'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {pageDescription || 'Vue d\'ensemble de l\'écosystème agricole'}
                    </p>
                  </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

                  {/* Partial Data Button */}
                  <Button variant="outline" className="hidden md:flex items-center">
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Données partielles
                  </Button>

                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <BellIcon className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      3
                    </Badge>
                  </Button>

                  {/* User info */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{userName || 'Admin National'}</p>
                      <p className="text-xs text-gray-500">{userRole || 'Admin National'}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {(userName || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
        </div>
      </div>

      {/* Action buttons */}
      {(showAddButton || showExportButton) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {showAddButton && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onAddClick}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          )}
          {showExportButton && (
            <Button 
              variant="outline"
              onClick={onExportClick}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;