/**
 * Create Session Modal
 * 
 * Modal dialog for creating a new session with custom name and description.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionCreated: (sessionId: string) => void;
}

export function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            setError('Session name is required');
            return;
        }

        if (name.length > 100) {
            setError('Session name must be 100 characters or less');
            return;
        }

        setError('');
        setIsCreating(true);

        try {
            // Create session via API
            const response = await api.post('/sessions', {
                name: name.trim(),
                description: description.trim() || undefined
            });

            if (response.data.success) {
                const sessionId = response.data.data.id;
                toast.success('Session created successfully!');

                // Reset form
                setName('');
                setDescription('');
                onClose();

                // Notify parent
                onSessionCreated(sessionId);
            }
        } catch (error: any) {
            console.error('Failed to create session:', error);
            toast.error(error.response?.data?.error || 'Failed to create session');
            setError('Failed to create session. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setName('');
            setDescription('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white">
                        Create New Session
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Give your learning session a name to help you track your progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Session Name */}
                    <div className="space-y-2">
                        <Label htmlFor="session-name" className="text-white">
                            Session Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="session-name"
                            placeholder="e.g., Subnetting Practice – Day 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-neon-blue"
                            autoFocus
                            disabled={isCreating}
                        />
                        <p className="text-xs text-slate-500">
                            {name.length}/100 characters
                        </p>
                    </div>

                    {/* Description (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="session-description" className="text-white">
                            Description <span className="text-slate-500 text-sm font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                            id="session-description"
                            placeholder="What will you be working on in this session?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-neon-blue resize-none"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="flex-1 border-white/20 hover:border-white/40"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create & Start'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
