import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './ui/AnimatedButton';

const ProfileEditModal = ({ isOpen, onClose, userData, onSave }) => {
  const [form, setForm] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500/20"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <AnimatedButton type="button" variant="outline" onClick={onClose}>
                  Cancel
                </AnimatedButton>
                <AnimatedButton type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </AnimatedButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileEditModal;