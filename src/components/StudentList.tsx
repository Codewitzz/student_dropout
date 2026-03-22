import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown } from "lucide-react";
import type { Student } from "@/types/database";

interface StudentListProps {
  students: Student[];
  isLoading?: boolean;
  onStudentClick?: (studentId: string) => void;
}

type SortField = "name" | "erp_number" | "department" | "year" | "email";
type SortDirection = "asc" | "desc";

export const StudentList = ({ students, isLoading = false, onStudentClick }: StudentListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Get unique departments and years for filters
  const departments = useMemo(() => {
    const depts = new Set<string>();
    students.forEach(s => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [students]);

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    students.forEach(s => {
      if (s.year) yearSet.add(s.year);
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [students]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.erp_number.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query) ||
        student.department?.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }

    // Apply year filter
    if (filterYear !== "all") {
      filtered = filtered.filter(student => student.year?.toString() === filterYear);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "erp_number":
          aValue = a.erp_number.toLowerCase();
          bValue = b.erp_number.toLowerCase();
          break;
        case "department":
          aValue = a.department || "";
          bValue = b.department || "";
          break;
        case "year":
          aValue = a.year || 0;
          bValue = b.year || 0;
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchQuery, sortField, sortDirection, filterDepartment, filterYear]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, ERP, email, phone, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedStudents.length} of {students.length} students
      </div>

      {/* Student Table */}
      <div className="border rounded-lg overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort("erp_number")}
              >
                <div className="flex items-center gap-2">
                  Enrollment No (ERP)
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  Email
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Mobile No</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort("department")}
              >
                <div className="flex items-center gap-2">
                  Department
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort("year")}
              >
                <div className="flex items-center gap-2">
                  Year
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedStudents.map((student) => (
                <TableRow 
                  key={student.id}
                  className={onStudentClick ? "cursor-pointer hover:bg-accent" : ""}
                  onClick={() => onStudentClick?.(student.id)}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.erp_number}</Badge>
                  </TableCell>
                  <TableCell>{student.email || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{student.phone || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>
                    {student.department ? (
                      <Badge variant="secondary">{student.department}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.year ? (
                      <Badge variant="outline">Year {student.year}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

