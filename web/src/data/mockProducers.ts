import { Producer } from '../services/producersService';

// Base producers data
const baseProducers: Producer[] = [
  {
    id: '1',
    cooperative_id: 'coop-1',
    first_name: 'Amadou',
    last_name: 'Diop',
    phone: '+221771234567',
    email: 'amadou.diop@email.com',
    region: 'Thiès',
    department: 'Thiès',
    commune: 'Thiès',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z',
    plots_count: 3,
    total_area: 2.5,
    last_visit: '2024-01-20T14:45:00Z',
    status: 'active'
  },
  {
    id: '2',
    cooperative_id: 'coop-1',
    first_name: 'Fatou',
    last_name: 'Sall',
    phone: '+221771234568',
    email: 'fatou.sall@email.com',
    region: 'Diourbel',
    department: 'Diourbel',
    commune: 'Diourbel',
    is_active: true,
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T11:20:00Z',
    plots_count: 2,
    total_area: 1.8,
    last_visit: '2024-01-18T11:20:00Z',
    status: 'active'
  },
  {
    id: '3',
    cooperative_id: 'coop-2',
    first_name: 'Moussa',
    last_name: 'Ndiaye',
    phone: '+221771234569',
    email: 'moussa.ndiaye@email.com',
    region: 'Kaolack',
    department: 'Kaolack',
    commune: 'Kaolack',
    is_active: false,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-12T16:30:00Z',
    plots_count: 1,
    total_area: 0.8,
    last_visit: '2024-01-12T16:30:00Z',
    status: 'inactive'
  },
  {
    id: '4',
    cooperative_id: 'coop-1',
    first_name: 'Aïcha',
    last_name: 'Ba',
    phone: '+221771234570',
    email: 'aicha.ba@email.com',
    region: 'Thiès',
    department: 'M\'bour',
    commune: 'M\'bour',
    is_active: true,
    created_at: '2024-01-08T14:20:00Z',
    updated_at: '2024-01-22T09:10:00Z',
    plots_count: 4,
    total_area: 3.2,
    last_visit: '2024-01-22T09:10:00Z',
    status: 'active'
  },
  {
    id: '5',
    cooperative_id: 'coop-2',
    first_name: 'Ibrahima',
    last_name: 'Faye',
    phone: '+221771234571',
    email: 'ibrahima.faye@email.com',
    region: 'Fatick',
    department: 'Fatick',
    commune: 'Fatick',
    is_active: true,
    created_at: '2024-01-12T11:45:00Z',
    updated_at: '2024-01-19T13:25:00Z',
    plots_count: 2,
    total_area: 1.5,
    last_visit: '2024-01-19T13:25:00Z',
    status: 'active'
  },
  {
    id: '6',
    cooperative_id: 'coop-1',
    first_name: 'Mariama',
    last_name: 'Cissé',
    phone: '+221771234572',
    email: 'mariama.cisse@email.com',
    region: 'Thiès',
    department: 'Thiès',
    commune: 'Pout',
    is_active: true,
    created_at: '2024-01-14T16:30:00Z',
    updated_at: '2024-01-21T10:15:00Z',
    plots_count: 3,
    total_area: 2.1,
    last_visit: '2024-01-21T10:15:00Z',
    status: 'active'
  },
  {
    id: '7',
    cooperative_id: 'coop-2',
    first_name: 'Cheikh',
    last_name: 'Gueye',
    phone: '+221771234573',
    email: 'cheikh.gueye@email.com',
    region: 'Diourbel',
    department: 'Bambey',
    commune: 'Bambey',
    is_active: false,
    created_at: '2024-01-03T12:00:00Z',
    updated_at: '2024-01-15T08:45:00Z',
    plots_count: 1,
    total_area: 0.9,
    last_visit: '2024-01-15T08:45:00Z',
    status: 'inactive'
  },
  {
    id: '8',
    cooperative_id: 'coop-1',
    first_name: 'Khadija',
    last_name: 'Diallo',
    phone: '+221771234574',
    email: 'khadija.diallo@email.com',
    region: 'Thiès',
    department: 'Thiès',
    commune: 'Thiès',
    is_active: true,
    created_at: '2024-01-16T13:20:00Z',
    updated_at: '2024-01-23T15:40:00Z',
    plots_count: 2,
    total_area: 1.7,
    last_visit: '2024-01-23T15:40:00Z',
    status: 'active'
  }
];

// Generate more producers for testing pagination
const generateMockProducers = (): Producer[] => {
  const firstNames = ['Amadou', 'Fatou', 'Moussa', 'Aïcha', 'Ibrahima', 'Mariama', 'Cheikh', 'Khadija', 'Ousmane', 'Aminata', 'Modou', 'Ndeye', 'Pape', 'Awa', 'Samba', 'Rokhaya', 'Mamadou', 'Aïssatou', 'Aliou', 'Fatima'];
  const lastNames = ['Diop', 'Sall', 'Ndiaye', 'Ba', 'Faye', 'Cissé', 'Gueye', 'Diallo', 'Fall', 'Niang', 'Seck', 'Thiam', 'Sow', 'Diagne', 'Mbaye', 'Camara', 'Sy', 'Kane', 'Traoré', 'Dia'];
  const regions = ['Thiès', 'Diourbel', 'Kaolack', 'Fatick', 'Dakar', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Ziguinchor', 'Matam'];
  const departments = ['Thiès', 'Diourbel', 'Kaolack', 'Fatick', 'Dakar', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Ziguinchor', 'Matam', 'M\'bour', 'Bambey', 'Pout', 'Tivaouane', 'Rufisque'];
  const communes = ['Thiès', 'Diourbel', 'Kaolack', 'Fatick', 'Dakar', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Ziguinchor', 'Matam', 'M\'bour', 'Bambey', 'Pout', 'Tivaouane', 'Rufisque', 'Guédiawaye', 'Pikine', 'Médina', 'Plateau', 'Liberté'];

  const producers: Producer[] = [...baseProducers];

  for (let i = 9; i <= 150; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const commune = communes[Math.floor(Math.random() * communes.length)];
    const isActive = Math.random() > 0.1; // 90% active
    const phoneNumber = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    
    const createdDate = new Date(2024, 0, Math.floor(Math.random() * 31) + 1);
    const updatedDate = new Date(createdDate.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);

    producers.push({
      id: i.toString(),
      cooperative_id: `coop-${Math.floor(Math.random() * 3) + 1}`,
      first_name: firstName,
      last_name: lastName,
      phone: phoneNumber,
      email: email,
      region: region,
      department: department,
      commune: commune,
      is_active: isActive,
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
      plots_count: Math.floor(Math.random() * 5) + 1,
      total_area: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
      last_visit: updatedDate.toISOString(),
      status: isActive ? 'active' : 'inactive'
    });
  }

  return producers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const mockProducers: Producer[] = generateMockProducers();
