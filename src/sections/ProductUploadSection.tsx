import React from 'react';

export const ProductUploadSection: React.FC = () => {
  return (
    <section className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Product Upload</h2>
          <p className="text-sm text-white/60">Add new products tied to destinations.</p>
        </div>
      </div>
      <form className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Product name</label>
          <input
            type="text"
            placeholder="Ilocos Souvenir Bundle"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Destination name</label>
          <input
            type="text"
            placeholder="Vigan Heritage"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm text-white/70">Description</label>
          <textarea
            rows={3}
            placeholder="Describe the product..."
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Image upload</label>
          <input
            type="file"
            accept="image/*"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-xs file:text-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Image URL</label>
          <input
            type="url"
            placeholder="https://..."
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Created at</label>
          <input
            type="datetime-local"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Last updated</label>
          <input
            type="datetime-local"
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="button"
            className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Upload product
          </button>
        </div>
      </form>
    </section>
  );
};
