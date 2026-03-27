// src/components/ui/skill-select.jsx
import { useState, useEffect } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { getAllSkills } from "@/api/profile";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Technical", "Design", "Writing", "Marketing", "Business", "Other"];
const PROFICIENCY_LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"];

export function SkillSelect({ selectedSkills, onChange, error }) {
  const [allSkills, setAllSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllSkills()
      .then((data) => {
        setAllSkills(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Fallback skills if API fails
        setAllSkills([
          { id: "1", name: "JavaScript", category: "Technical" },
          { id: "2", name: "React", category: "Technical" },
          { id: "3", name: "Node.js", category: "Technical" },
          { id: "4", name: "Python", category: "Technical" },
          { id: "5", name: "Java", category: "Technical" },
          { id: "6", name: "UI/UX Design", category: "Design" },
          { id: "7", name: "Graphic Design", category: "Design" },
          { id: "8", name: "Content Writing", category: "Writing" },
          { id: "9", name: "SEO", category: "Marketing" },
          { id: "10", name: "Digital Marketing", category: "Marketing" },
          { id: "11", name: "Project Management", category: "Business" },
          { id: "12", name: "Data Analysis", category: "Technical" },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredSkills = allSkills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const notAlreadySelected = !selectedSkills.some((s) => s.id === skill.id || s.name === skill.name);
    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const handleAddSkill = (skill) => {
    onChange([...selectedSkills, { ...skill, proficiencyLevel: "INTERMEDIATE" }]);
    setSearchTerm("");
  };

  const handleRemoveSkill = (skillId) => {
    onChange(selectedSkills.filter((s) => s.id !== skillId));
  };

  const updateProficiency = (skillId, level) => {
    onChange(
      selectedSkills.map((s) => (s.id === skillId ? { ...s, proficiencyLevel: level } : s))
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ink">Skills</label>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-surface rounded-xl border border-border">
          {selectedSkills.map((skill) => (
            <div
              key={skill.id || skill.name}
              className="flex items-center gap-2 bg-primary-bg text-primary-dark px-3 py-1.5 rounded-lg text-sm"
            >
              <span>{skill.name}</span>
              <select
                value={skill.proficiencyLevel || "INTERMEDIATE"}
                onChange={(e) => updateProficiency(skill.id, e.target.value)}
                className="bg-primary-bg text-primary-dark text-xs border-none rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.id)}
                className="hover:bg-primary-dark/20 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Skill Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "w-full flex items-center justify-between gap-2 border-[1.5px] border-border rounded-xl px-4 py-2.5 text-[13.5px] bg-surface focus:outline-none focus:border-primary transition-all",
            error && "border-danger bg-danger-bg"
          )}
        >
          <span className="text-ink-3">
            {selectedSkills.length === 0 ? "Select skills..." : `${selectedSkills.length} skill(s) selected`}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-ink-3 transition-transform", showDropdown && "rotate-180")} />
        </button>

        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 p-3 border-b border-border overflow-x-auto">
              <button
                onClick={() => setSelectedCategory("All")}
                className={cn(
                  "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                  selectedCategory === "All"
                    ? "bg-primary text-primary-dark"
                    : "bg-surface text-ink-2 hover:bg-border"
                )}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-dark"
                      : "bg-surface text-ink-2 hover:bg-border"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skills List */}
            <div className="max-h-64 overflow-y-auto p-2">
              {isLoading ? (
                <div className="p-4 text-center text-ink-3 text-sm">Loading skills...</div>
              ) : filteredSkills.length === 0 ? (
                <div className="p-4 text-center text-ink-3 text-sm">
                  {searchTerm ? "No skills match your search" : "All available skills selected"}
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface rounded-lg transition-colors text-left"
                  >
                    <div>
                      <div className="text-ink">{skill.name}</div>
                      <div className="text-xs text-ink-3">{skill.category}</div>
                    </div>
                    <span className="text-xs text-primary bg-primary-bg px-2 py-0.5 rounded">+ Add</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Click outside to close */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}