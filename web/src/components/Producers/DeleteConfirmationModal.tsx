import React from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { AlertTriangle } from 'lucide-react';

// Type assertion pour résoudre le conflit de types
const AlertTriangleIcon = AlertTriangle as any;

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  producerName?: string;
  loading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  producerName = 'ce producteur',
  loading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription className="mt-1">
                Cette action est irréversible
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer <strong>{producerName}</strong> ?
          </p>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800 font-medium mb-1">
              ⚠️ Attention : Cette action supprimera également :
            </p>
            <ul className="text-xs text-yellow-700 ml-4 list-disc">
              <li>Toutes les fiches d'exploitation du producteur</li>
              <li>Toutes les parcelles et cultures associées</li>
              <li>Toutes les opérations agricoles</li>
              <li>Toutes les observations et recommandations</li>
            </ul>
            <p className="text-xs text-yellow-700 mt-2 font-medium">
              Cette action est irréversible !
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
