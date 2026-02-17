import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { SearchSuggest } from '../components/SearchSuggest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  battle_cry: string | null;
};

const ROLE_OPTIONS = ['tourist', 'municipality', 'developer'] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

const AdminPage: React.FC = () => {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({
    role: '',
    battle: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    full_name: string;
    role: RoleOption;
    battle_cry: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfiles = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, battle_cry')
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
        toast.error('Failed to load profiles.');
        setProfiles([]);
      } else {
        setProfiles((data as AdminProfile[]) ?? []);
      }
      setIsLoading(false);
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProfiles = useMemo(() => {
    const roleFilter = columnFilters.role.trim().toLowerCase();
    const battleFilter = columnFilters.battle.trim().toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    return profiles.filter((profile) => {
      const name = profile.full_name?.toLowerCase() ?? '';
      const email = profile.email?.toLowerCase() ?? '';
      const role = profile.role?.toLowerCase() ?? '';
      const cry = profile.battle_cry?.toLowerCase() ?? '';
      const matchesQuery =
        !query || name.includes(query) || email.includes(query) || role.includes(query) || cry.includes(query);
      const matchesRole = !roleFilter || role === roleFilter;
      const matchesBattle =
        !battleFilter ||
        (battleFilter === 'has' ? Boolean(cry) : battleFilter === 'empty' ? !cry : true);
      return matchesQuery && matchesRole && matchesBattle;
    });
  }, [profiles, searchQuery, columnFilters]);

  const filterOptions = useMemo(() => {
    const roles = Array.from(new Set(profiles.map((profile) => profile.role || '').filter(Boolean)));
    const hasBattle = profiles.some((profile) => Boolean(profile.battle_cry));
    const hasEmptyBattle = profiles.some((profile) => !profile.battle_cry);
    return {
      roles,
      battleOptions: [
        ...(hasBattle ? [{ label: 'Has battle cry', value: 'has' }] : []),
        ...(hasEmptyBattle ? [{ label: 'Empty', value: 'empty' }] : []),
      ],
    };
  }, [profiles]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const totalCount = filteredProfiles.length;
  const showingFrom = totalCount === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const showingTo = totalCount === 0 ? 0 : Math.min(safePage * rowsPerPage, totalCount);
  const pagedProfiles = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProfiles, rowsPerPage, safePage]);

  const pageLinks = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const pages = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [safePage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, columnFilters, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startEdit = (profile: AdminProfile) => {
    setEditingId(profile.id);
    setEditValues({
      full_name: profile.full_name ?? '',
      role: (ROLE_OPTIONS.includes((profile.role ?? '') as RoleOption)
        ? (profile.role as RoleOption)
        : 'tourist') as RoleOption,
      battle_cry: profile.battle_cry ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const saveEdit = async (profileId: string) => {
    if (!editValues) return;
    const payload = {
      full_name: editValues.full_name.trim() || null,
      role: editValues.role,
      battle_cry: editValues.battle_cry.trim() || null,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profileId);

    if (updateError) {
      setError(updateError.message);
      toast.error('Failed to save profile changes.');
      return;
    }

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === profileId ? { ...profile, ...payload } : profile
      )
    );
    toast.success('Profile updated.');
    cancelEdit();
  };

  const handleDelete = async (profileId: string) => {
    const confirmed = window.confirm('Delete this user profile? This cannot be undone.');
    if (!confirmed) return;
    const { error: deleteError } = await supabase.from('profiles').delete().eq('id', profileId);
    if (deleteError) {
      setError(deleteError.message);
      toast.error('Failed to delete profile.');
      return;
    }
    setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
    toast.success('Profile deleted.');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pt-18 md:pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Admin</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Developer Console</h1>


        <motion.section
          className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Profiles</h2>
              <p className="text-sm text-white/60">Manage user details.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <SearchSuggest
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search users"
                items={profiles.map((profile) => ({
                  id: profile.id,
                  label: profile.full_name || profile.email || profile.id,
                  meta: profile.role ?? 'tourist',
                }))}
                className="w-full sm:max-w-xs [&>div]:px-3 [&>div]:py-2 [&>div]:gap-2 [&_input]:text-sm [&_input]:px-1"
              />
              <div className="flex items-center justify-between gap-2 text-xs text-white/60 sm:justify-end">
                <span>Rows</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="rounded-full border border-white/20 bg-slate-950 px-3 py-1.5 pr-8 text-xs text-white"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Table className="text-white">
              <TableHeader>
                <TableRow className="border-white/10 text-white/50">
                  <TableHead className="text-white/50">Name</TableHead>
                  <TableHead className="text-white/50">Email</TableHead>
                  <TableHead className="text-white/50">Role</TableHead>
                  <TableHead className="text-white/50">Battle Cry</TableHead>
                  <TableHead className="text-right text-white/50">Actions</TableHead>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableHead />
                  <TableHead />
                  <TableHead>
                    <select
                      value={columnFilters.role}
                      onChange={(event) =>
                        setColumnFilters((prev) => ({ ...prev, role: event.target.value }))
                      }
                      className="w-full rounded-full border border-white/20 bg-slate-950 px-3 py-1.5 pr-8 text-xs text-white"
                    >
                      <option value="">All</option>
                      {filterOptions.roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableHead>
                  <TableHead>
                    <select
                      value={columnFilters.battle}
                      onChange={(event) =>
                        setColumnFilters((prev) => ({ ...prev, battle: event.target.value }))
                      }
                      className="w-full rounded-full border border-white/20 bg-slate-950 px-3 py-1.5 pr-8 text-xs text-white"
                    >
                      <option value="">All</option>
                      {filterOptions.battleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableRow key={`profile-skeleton-${index}`} className="border-white/10 align-top">
                      <TableCell className="py-3">
                        <Skeleton className="h-9 w-48 rounded-lg" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-9 w-28 rounded-lg" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-9 w-56 rounded-lg" />
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-20 rounded-full" />
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProfiles.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell className="py-6 text-white/60" colSpan={5}>
                      No profiles match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedProfiles.map((profile) => {
                    const isEditing = editingId === profile.id;
                    const battleCry = profile.battle_cry ?? '';
                    const shouldCollapseBattleCry = battleCry.length > 60;
                    return (
                      <TableRow key={profile.id} className="border-white/10 align-top">
                        <TableCell>
                          {isEditing ? (
                            <input
                              value={editValues?.full_name ?? ''}
                              onChange={(event) =>
                                setEditValues((prev) =>
                                  prev ? { ...prev, full_name: event.target.value } : prev
                                )
                              }
                              className="w-48 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                            />
                          ) : (
                            <span>{profile.full_name || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white/70">{profile.email || '—'}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <select
                              value={editValues?.role ?? 'tourist'}
                              onChange={(event) =>
                                setEditValues((prev) =>
                                  prev
                                    ? { ...prev, role: event.target.value as RoleOption }
                                    : prev
                                )
                              }
                              className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm text-white"
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="capitalize">{profile.role || 'tourist'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <input
                              value={editValues?.battle_cry ?? ''}
                              onChange={(event) =>
                                setEditValues((prev) =>
                                  prev ? { ...prev, battle_cry: event.target.value } : prev
                                )
                              }
                              className="w-56 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                            />
                          ) : (
                            <div className="max-w-[220px]">
                              {battleCry ? (
                                shouldCollapseBattleCry ? (
                                  <Accordion type="single" collapsible>
                                    <AccordionItem value={`battle-${profile.id}`} className="border-none">
                                      <AccordionTrigger className="group py-0 text-xs text-white/70 hover:no-underline [&>svg]:hidden">
                                        <span className="line-clamp-1 text-left group-data-[state=open]:hidden">
                                          {battleCry}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wide text-white/40 group-data-[state=open]:hidden">
                                          Expand
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wide text-white/40 group-data-[state=closed]:hidden">
                                          Collapse
                                        </span>
                                      </AccordionTrigger>
                                      <AccordionContent className="pt-2 text-xs text-white/70">
                                        {battleCry}
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                ) : (
                                  <span className="text-white/70">{battleCry}</span>
                                )
                              ) : (
                                <span className="text-white/60">—</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(profile.id)}
                                  className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold hover:bg-white/20"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(profile)}
                                  className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold hover:bg-white/20"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(profile.id)}
                                  className="rounded-full px-4 py-2 text-xs font-semibold text-red-200 hover:text-red-100"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/60">
              Showing {showingFrom}–{showingTo} of {totalCount}
            </p>
            <Pagination className="justify-end sm:justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                  />
                </PaginationItem>
                {pageLinks.map((page, index) => {
                  const prevPage = pageLinks[index - 1];
                  const shouldShowEllipsis = prevPage && page - prevPage > 1;
                  return (
                    <React.Fragment key={`page-${page}`}>
                      {shouldShowEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === safePage}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default AdminPage;
