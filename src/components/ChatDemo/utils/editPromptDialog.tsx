import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

interface EditPromptDialogProps {
  open: boolean;
  onClose: () => void;
  promptName: string;
  promptTemplate: string;
  pipelineId: string;
  onSaveSuccess: () => void;
}

const EditPromptDialog: React.FC<EditPromptDialogProps> = ({
  open,
  onClose,
  promptName,
  promptTemplate,
  pipelineId,
  onSaveSuccess,
}) => {
  const [editedTemplate, setEditedTemplate] = useState(promptTemplate);
  const { toast } = useToast();
  const { getClient } = useUserContext();

  useEffect(() => {
    setEditedTemplate(promptTemplate);
  }, [promptTemplate]);

  const handleSave = async () => {
    if (!pipelineId) {
      toast({
        title: 'Error',
        description: 'No pipeline ID available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const client = await getClient(pipelineId);
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.updatePrompt(promptName, editedTemplate);
      toast({
        title: 'Prompt updated',
        description: 'The prompt has been successfully updated.',
        variant: 'success',
      });
      onSaveSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update the prompt. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating prompt:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Prompt: {promptName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
          <div className="grid w-full gap-2">
            <Textarea
              value={editedTemplate}
              onChange={(e) => setEditedTemplate(e.target.value)}
              placeholder="Enter prompt template"
              rows={10}
            />
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPromptDialog;
