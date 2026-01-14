import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Users, 
  Briefcase, 
  HardHat, 
  Plane, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  HeartPulse,
  BookOpen,
  Home,
  AlertTriangle,
  Skull,
  Armchair, 
  Info,
  Wallet,
  Baby
} from 'lucide-react';

// --- CONSTANTS & REGULATION DATA (2025/2026 RULES) ---

const JP_MAX_WAGE_2025 = 10547400; // Cap Upah JP (Update Berkala)
const JKP_WAGE_CAP = 5000000;      // Cap Upah JKP

// --- PMI SPECIFIC CONSTANTS ---
const PMI_PRE_PLACEMENT_COST = 37500; // Iuran Pra-Penempatan (Wajib)
const PMI_EXTENSION_COST = 13500;     // Iuran Perpanjangan per bulan

const PMI_PACKAGES = [
  { label: 'Paket 24 Bulan', price: 332500, duration: 24 },
  { label: 'Paket 12 Bulan', price: 189000, duration: 12 },
  { label: 'Paket 6 Bulan', price: 108000, duration: 6 },
];

// Referensi: Lampiran I PP Nomor 44 Tahun 2015
const JKK_RISK_RATES = [
  { 
    label: 'Sangat Rendah', 
    rate: 0.0024,
    desc: 'Bekerja di ruangan, minim risiko fisik. Contoh: Jasa Perbankan, Asuransi, Jasa Perusahaan, Konveksi/Garmen, Penjahitan, Kantor Administrasi.' 
  },
  { 
    label: 'Rendah', 
    rate: 0.0054,
    desc: 'Risiko sedang di lapangan/pabrik ringan. Contoh: Pertanian, Peternakan, Perikanan Darat, Perdagangan Eceran, Industri Makanan/Minuman.' 
  },
  { 
    label: 'Sedang', 
    rate: 0.0089,
    desc: 'Industri pengolahan & perkebunan skala menengah. Contoh: Perkebunan (Karet/Tebu/Kopi), Industri Gula, Tekstil, Barang dari Logam, Percetakan.' 
  },
  { 
    label: 'Tinggi', 
    rate: 0.0127,
    desc: 'Pekerjaan fisik berat & transportasi. Contoh: Konstruksi Gedung, Angkutan Darat/Laut/Udara, Industri Logam Dasar, Kimia.' 
  },
  { 
    label: 'Sangat Tinggi', 
    rate: 0.0174,
    desc: 'Risiko ekstrem/berbahaya. Contoh: Pertambangan (Minyak, Gas, Batubara, Bijih Logam), Penebangan Kayu Hutan, Penggalian.' 
  },
];

// --- HELPER FUNCTIONS ---

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateCompoundSavings = (monthlyContribution, years, annualRate) => {
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (months <= 0) return 0;
  let futureValue = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return futureValue;
};

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${color}-100 text-${color}-700`}>
    {children}
  </span>
);

const BenefitItem = ({ label, amount, highlight, isNonCash, details }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
      <div 
        onClick={() => details && setIsOpen(!isOpen)}
        className={`flex justify-between items-center p-3 ${details ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}
      >
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">{label}</span>
            {details && (
                isOpen ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>
            )}
        </div>
        <span className={`font-bold ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>
            {isNonCash ? amount : formatIDR(amount)}
        </span>
      </div>
      {isOpen && details && (
        <div className="bg-gray-50/80 p-3 text-sm text-gray-600 border-t border-gray-100 animate-in slide-in-from-top-1">
            {details}
        </div>
      )}
    </div>
  );
};

export default function BPJSSimulatorApp() {
  const [activeTab, setActiveTab] = useState('simulation'); 
  const [segment, setSegment] = useState('PU'); 
  
  // Input States - PU
  const [baseSalary, setBaseSalary] = useState(4000000); 
  const [fixedAllowance, setFixedAllowance] = useState(1000000); 
  
  // Input States - BPU (Separate)
  const [bpuIncome, setBpuIncome] = useState(1000000);
  const [bpuJhtEnabled, setBpuJhtEnabled] = useState(true); // Default active, but user can toggle

  // Input States - PMI
  const [pmiPackageIndex, setPmiPackageIndex] = useState(0);
  const [pmiJhtEnabled, setPmiJhtEnabled] = useState(false); 
  const [pmiIncome, setPmiIncome] = useState(3000000); 

  // Input States - Common
  const [tenure, setTenure] = useState(5); 
  const [annualYield, setAnnualYield] = useState(5.5); // Default Annual Yield Percentage
  const [jkkRiskIndex, setJkkRiskIndex] = useState(0);
  const [jakonValue, setJakonValue] = useState(100000000); 
  const [scholarshipKids, setScholarshipKids] = useState(2); 

  // UI State
  const [riskScenario, setRiskScenario] = useState('contribution');
  const [expandedDetail, setExpandedDetail] = useState(null); 

  const [results, setResults] = useState(null);

  // --- CALCULATION LOGIC ---

  useEffect(() => {
    calculate();
  }, [segment, baseSalary, fixedAllowance, bpuIncome, bpuJhtEnabled, pmiIncome, pmiJhtEnabled, tenure, annualYield, jkkRiskIndex, jakonValue, pmiPackageIndex, scholarshipKids]);

  const calculate = () => {
    let res = {
      monthly: {},
      scenarios: {}
    };

    // Determine current effective income based on segment
    let currentIncome = 0;
    if (segment === 'PU') {
        currentIncome = baseSalary + fixedAllowance;
    } else if (segment === 'BPU') {
        currentIncome = bpuIncome;
    } else if (segment === 'PMI' && pmiJhtEnabled) {
        currentIncome = pmiIncome; 
    }

    // --- 1. HITUNG IURAN ---
    let monthlyJhtTotal = 0;
    let monthlyJpTotal = 0;
    let totalPmiAccumulatedCost = 0;
    let pmiCalculationDetails = "";
    
    if (segment === 'PU') {
      let jkkRate = JKK_RISK_RATES[jkkRiskIndex].rate;
      const jkkNominal = currentIncome * jkkRate;
      const jkmNominal = currentIncome * 0.003;
      const jhtEmp = currentIncome * 0.037;
      const jhtWkr = currentIncome * 0.02;
      monthlyJhtTotal = jhtEmp + jhtWkr;

      const jpBase = Math.min(currentIncome, JP_MAX_WAGE_2025);
      const jpEmp = jpBase * 0.02;
      const jpWkr = jpBase * 0.01;
      monthlyJpTotal = jpEmp + jpWkr;

      res.monthly = {
        workerPay: jhtWkr + jpWkr,
        companyPay: jkkNominal + jkmNominal + jhtEmp + jpEmp,
        details: [
            { 
              name: 'JKK (Kecelakaan Kerja)', 
              split: 'Ditanggung Perusahaan Full',
              amount: jkkNominal, 
              formula: `Perusahaan: ${formatIDR(currentIncome)} x ${(jkkRate*100).toFixed(2)}%` 
            },
            { 
              name: 'JKM (Kematian)', 
              split: 'Ditanggung Perusahaan Full',
              amount: jkmNominal, 
              formula: `Perusahaan: ${formatIDR(currentIncome)} x 0.3%` 
            },
            { 
              name: 'JHT (Hari Tua) - Total 5.7%', 
              split: '3.7% Perusahaan, 2% Pekerja',
              amount: monthlyJhtTotal, 
              formula: `Pekerja: ${formatIDR(jhtWkr)} (2%) + Perusahaan: ${formatIDR(jhtEmp)} (3.7%)` 
            },
            { 
              name: 'JP (Pensiun) - Total 3%', 
              split: '2% Perusahaan, 1% Pekerja',
              amount: monthlyJpTotal, 
              formula: `Pekerja: ${formatIDR(jpWkr)} (1%) + Perusahaan: ${formatIDR(jpEmp)} (2%) ${currentIncome > JP_MAX_WAGE_2025 ? '(Capped)' : ''}` 
            },
            { 
              name: 'JKP (Subsidi)', 
              split: 'Subsidi Pemerintah',
              amount: 0, 
              formula: 'Tidak mengurangi gaji (Subsidi + Rekomposisi JKK)' 
            },
        ]
      };
    } else if (segment === 'BPU') {
      const jkkNominal = Math.max(currentIncome * 0.01, 10000); 
      const jkmNominal = 6800; 
      
      let jhtNominal = 0;
      let details = [
         { name: 'JKK (Kecelakaan Kerja)', split: 'Mandiri 1%', amount: jkkNominal, formula: `${formatIDR(currentIncome)} x 1% (Min Rp 10.000)` },
         { name: 'JKM (Kematian)', split: 'Mandiri Flat', amount: jkmNominal, formula: 'Tarif Tetap (Flat) Rp 6.800' },
      ];

      // BPU JHT Logic based on Checkbox
      if (bpuJhtEnabled) {
          jhtNominal = currentIncome * 0.02; 
          details.push({ name: 'JHT (Hari Tua)', split: 'Mandiri 2%', amount: jhtNominal, formula: `${formatIDR(currentIncome)} x 2% (Sukarela)` });
      }

      monthlyJhtTotal = jhtNominal;

      res.monthly = {
        workerPay: jkkNominal + jkmNominal + jhtNominal,
        details: details
      };
    } else if (segment === 'JAKON') {
        const jkkNominal = jakonValue * 0.0021;
        const jkmNominal = jakonValue * 0.0003;
        const total = jkkNominal + jkmNominal;
        res.monthly = {
            companyPay: total,
            workerPay: 0,
            details: [
                { name: 'JKK Konstruksi', split: 'Kontraktor 0.21%', amount: jkkNominal, formula: `${formatIDR(jakonValue)} x 0.21%` },
                { name: 'JKM Konstruksi', split: 'Kontraktor 0.03%', amount: jkmNominal, formula: `${formatIDR(jakonValue)} x 0.03%` },
            ]
        };
    } else if (segment === 'PMI') {
        // PMI CALCULATION LOGIC FIX
        const pkg = PMI_PACKAGES[pmiPackageIndex];
        const totalMonthsWorking = tenure * 12;
        
        // 1. Fixed Cost (Pra + Paket Awal)
        let totalPmiWajib = PMI_PRE_PLACEMENT_COST + pkg.price;
        
        // 2. Extension Cost
        let extensionCost = 0;
        let monthsCovered = pkg.duration;
        let monthsExtended = 0;

        if (totalMonthsWorking > monthsCovered) {
            monthsExtended = totalMonthsWorking - monthsCovered;
            extensionCost = monthsExtended * PMI_EXTENSION_COST;
            totalPmiWajib += extensionCost;
        }

        pmiCalculationDetails = `(Pra-Penempatan ${formatIDR(PMI_PRE_PLACEMENT_COST)}) + (Paket Awal ${pkg.duration} Bulan: ${formatIDR(pkg.price)})`;
        if (monthsExtended > 0) {
            pmiCalculationDetails += ` + (Perpanjangan ${monthsExtended} Bulan x ${formatIDR(PMI_EXTENSION_COST)})`;
        }

        // 3. JHT Calculation (If Enabled)
        let jhtNominal = 0;
        let details = [{ 
            name: 'Paket PMI (Wajib)', 
            split: 'Total Kontrak + Perpanjangan',
            amount: totalPmiWajib, // Show total accumulated here for display context
            formula: pmiCalculationDetails // Detailed formula instead of generic string
        }];

        if (pmiJhtEnabled) {
            jhtNominal = currentIncome * 0.02; 
            monthlyJhtTotal = jhtNominal;
            details.push({
                name: 'JHT (Sukarela)',
                split: 'Mandiri (2%)',
                amount: jhtNominal,
                formula: `${formatIDR(currentIncome)} x 2%`
            });
        }

        totalPmiAccumulatedCost = totalPmiWajib + (jhtNominal * totalMonthsWorking);

        res.monthly = {
            workerPay: pmiJhtEnabled ? jhtNominal : 0, // Monthly recurring only
            pmiTotalAccumulated: totalPmiAccumulatedCost, // Special field for PMI total
            pmiCalcDetails: pmiCalculationDetails,
            details: details
        };
    }

    // --- 2. HITUNG SALDO AKUMULASI (ESTIMASI) ---
    // If JHT is not enabled (monthlyJhtTotal is 0), balance will be 0
    const yieldRate = annualYield / 100;
    const jhtBalance = calculateCompoundSavings(monthlyJhtTotal, tenure, yieldRate);
    const jhtPrincipal = monthlyJhtTotal * 12 * tenure; 
    const jhtInterest = jhtBalance - jhtPrincipal; 

    // JP Balance Calculation (Only PU)
    const jpBalance = segment === 'PU' ? calculateCompoundSavings(monthlyJpTotal, tenure, yieldRate) : 0; 
    const jpPrincipal = monthlyJpTotal * 12 * tenure;
    const jpInterest = jpBalance - jpPrincipal;

    // --- 3. HITUNG MANFAAT PER SKENARIO RISIKO ---
    
    // --- PREPARE ACCORDION DETAILS ---

    // A. BEASISWA DETAILS
    const maxScholarship = 174000000;
    let scholarshipVal = 0;
    if (tenure >= 3 && scholarshipKids > 0) {
        scholarshipVal = scholarshipKids === 1 ? maxScholarship / 2 : maxScholarship;
    }
    const scholarshipDetailsContent = (
        <div className="space-y-1">
            <p className="text-xs font-bold mb-1">Maksimal Manfaat per Tahun:</p>
            <div className="flex justify-between text-xs"><span>TK/SD:</span><span>Rp 1.500.000</span></div>
            <div className="flex justify-between text-xs"><span>SMP:</span><span>Rp 2.000.000</span></div>
            <div className="flex justify-between text-xs"><span>SMA:</span><span>Rp 3.000.000</span></div>
            <div className="flex justify-between text-xs"><span>Kuliah (S1):</span><span>Rp 12.000.000</span></div>
            <p className="text-xs mt-1 italic text-gray-500">*Diberikan bertahap sesuai jenjang pendidikan anak.</p>
        </div>
    );

    // B. JHT DETAILS (SALDO)
    const jhtDetailsContent = (
        <div className="space-y-2">
            <p className="font-bold text-xs uppercase text-gray-500 mb-2">Rincian Saldo JHT</p>
            <div className="flex justify-between">
                <span>Pokok Iuran:</span>
                <span className="font-mono">{formatIDR(jhtPrincipal)}</span>
            </div>
            <div className="flex justify-between">
                <span>Estimasi Bunga ({annualYield}%):</span>
                <span className="font-mono text-blue-600">+{formatIDR(jhtInterest)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 text-xs italic text-gray-400">
                *Asumsi saldo tidak pernah diambil & imbal hasil stabil {annualYield}%.
            </div>
        </div>
    );

    // C. JP LUMP SUM DETAILS (DYNAMIC TEXT FIX)
    const isJpLumpsum = tenure < 15;
    const jpStatusText = isJpLumpsum 
        ? "*Dibayarkan sekaligus (Akumulasi iuran + Hasil Pengembangan) karena masa iur kurang dari 15 tahun."
        : "*Dibayarkan secara berkala setiap bulan (Manfaat Pensiun) karena masa iur mencapai 15 tahun.";

    const jpLumpSumDetails = (
        <div className="space-y-2">
            <p className="font-bold text-xs uppercase text-gray-500 mb-2">Rincian Saldo JP (Lump Sum)</p>
            <div className="flex justify-between">
                <span>Pokok Iuran (3%):</span>
                <span className="font-mono">{formatIDR(jpPrincipal)}</span>
            </div>
            <div className="flex justify-between">
                <span>Estimasi Bunga ({annualYield}%):</span>
                <span className="font-mono text-blue-600">+{formatIDR(jpInterest)}</span>
            </div>
            <p className="text-xs mt-1 text-gray-500">{jpStatusText}</p>
        </div>
    );

    // D. JP MONTHLY DETAILS (SEUMUR HIDUP)
    const jpMonthlyDetails = (
        <div className="space-y-2">
            <p className="font-bold text-xs uppercase text-gray-500 mb-2">Aturan Pembayaran Berkala</p>
            <ol className="list-decimal pl-4 text-xs space-y-1 text-gray-600">
                <li>Dibayarkan setiap bulan kepada Peserta (Pensiunan) sampai meninggal dunia.</li>
                <li>Jika peserta meninggal, diteruskan ke Janda/Duda yang sah (sampai meninggal/menikah lagi).</li>
                <li>Jika Janda/Duda meninggal/menikah lagi, diteruskan ke Anak (maks 2 orang, sampai usia 23/bekerja/menikah).</li>
            </ol>
            <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700">Rumus: 1% x Masa Iur x Rata-rata Upah Tertimbang</span>
            </div>
        </div>
    );

    // E. JKM DETAILS (Death Normal)
    const jkmLumpsum = 42000000;
    const jkmDetailsContent = (
        <div className="space-y-1">
            <div className="flex justify-between"><span>Santunan Kematian:</span><span>Rp 20.000.000</span></div>
            <div className="flex justify-between font-medium text-blue-700">
                <span>Santunan Berkala:</span>
                <span>Rp 12.000.000</span>
            </div>
            <div className="text-xs text-right text-gray-400 mb-1">(Dibayarkan Sekaligus sesuai PP 82/2019)</div>
            <div className="flex justify-between"><span>Biaya Pemakaman:</span><span>Rp 10.000.000</span></div>
        </div>
    );

    // F. JKK DETAILS (Death Work)
    const jkkDeathComp = 48 * currentIncome;
    const jkkFuneral = 10000000;
    const jkkBerkala = 12000000; // Santunan Berkala JKK 12jt (PP 82/2019)
    const jkkScholarshipVal = scholarshipKids > 0 ? (scholarshipKids === 1 ? 87000000 : 174000000) : 0;
    
    const jkkDeathDetails = (
        <div className="space-y-1">
            <div className="flex justify-between"><span>Santunan (48x Upah):</span><span>{formatIDR(jkkDeathComp)}</span></div>
            <div className="flex justify-between font-medium text-blue-700">
                <span>Santunan Berkala:</span>
                <span>{formatIDR(jkkBerkala)}</span>
            </div>
            <div className="text-xs text-right text-gray-400 mb-1">(Dibayarkan Sekaligus)</div>
            <div className="flex justify-between"><span>Biaya Pemakaman:</span><span>{formatIDR(jkkFuneral)}</span></div>
        </div>
    );

    // G. SICK DETAILS & TRANSPORT
    const sickDetails = (
        <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>12 Bulan Pertama:</span><span>100% Upah</span></div>
            <div className="flex justify-between text-xs"><span>Bulan Berikutnya:</span><span>50% Upah</span></div>
            <p className="text-xs text-gray-500 mt-1">*Hingga dinyatakan sembuh, cacat, atau meninggal.</p>
        </div>
    );

    const transportDetails = (
        <div className="space-y-1">
            <p className="text-xs font-bold mb-1">Penggantian Biaya Transportasi (Maks):</p>
            <div className="flex justify-between text-xs"><span>Darat/Sungai:</span><span>Rp 5.000.000</span></div>
            <div className="flex justify-between text-xs"><span>Laut:</span><span>Rp 2.000.000</span></div>
            <div className="flex justify-between text-xs"><span>Udara:</span><span>Rp 10.000.000</span></div>
            <p className="text-xs text-gray-500 mt-1">*Sesuai bukti kwitansi resmi.</p>
        </div>
    );

    // Skenario A: Meninggal Dunia Biasa (JKM)
    res.scenarios.death_normal = {
        lumpsum: jkmLumpsum, 
        lumpsumDetails: jkmDetailsContent,
        scholarship: scholarshipVal,
        scholarshipDetails: scholarshipDetailsContent,
        jhtBalance: jhtBalance,
        jhtDetails: jhtDetailsContent,
        jpBalance: jpBalance, 
        jpDetails: jpLumpSumDetails,
        total: jkmLumpsum + scholarshipVal + jhtBalance + jpBalance,
        notes: tenure < 3 ? "Masa iur < 3 tahun, belum dapat Beasiswa." : (scholarshipKids === 0 ? "Tidak ada beasiswa (0 Anak)" : `Termasuk Beasiswa ${scholarshipKids} Anak (Estimasi).`)
    };

    // Skenario B: Meninggal Kecelakaan Kerja (JKK)
    res.scenarios.death_work = {
        lumpsum: jkkDeathComp, 
        jkkDeathTotal: jkkDeathComp + jkkFuneral + jkkBerkala, 
        jkkDeathDetails: jkkDeathDetails,
        scholarship: jkkScholarshipVal,
        scholarshipDetails: scholarshipDetailsContent,
        jhtBalance: jhtBalance,
        jhtDetails: jhtDetailsContent,
        jpBalance: jpBalance,
        jpDetails: jpLumpSumDetails,
        total: jkkDeathComp + jkkFuneral + jkkBerkala + jkkScholarshipVal + jhtBalance + jpBalance,
        notes: "Santunan 48x Upah + Berkala + Pemakaman + Beasiswa."
    };

    // Skenario C: Sakit/Kecelakaan Kerja (Non-Meninggal)
    res.scenarios.sick = {
        stmb1: currentIncome, 
        stmbDetails: sickDetails,
        medical: "Unlimited (Sesuai Medis)",
        transport: 5000000, 
        transportDetails: transportDetails,
        notes: "STMB 100% Upah untuk 12 bulan pertama."
    };

    // Skenario D: PHK (JKP) - Hanya PU
    const jkpEligible = tenure >= 1; 
    const jkpWageBase = Math.min(currentIncome, JKP_WAGE_CAP);
    const jkpTotalCash = (jkpEligible && segment === 'PU') ? (jkpWageBase * 0.6 * 6) : 0;
    const jkpDetailsContent = jkpEligible ? (
         <div className="space-y-1">
            <p className="font-bold text-xs uppercase text-gray-500 mb-1">Rincian Perhitungan:</p>
            <p>60% x {formatIDR(jkpWageBase)} x 6 Bulan</p>
            <p className="text-xs text-orange-600 mt-1">
                *Dasar upah maks Rp 5.000.000.
            </p>
         </div>
    ) : "Masa iur belum mencapai 12 bulan";
    
    res.scenarios.layover = {
        cash: jkpTotalCash,
        jkpDetails: jkpDetailsContent,
        jhtBalance: jhtBalance,
        jhtDetails: jhtDetailsContent,
        total: jkpTotalCash + jhtBalance,
        eligible: jkpEligible,
        notes: segment !== 'PU' ? "Program JKP Khusus PU" : (jkpEligible ? "Uang Tunai 6 Bulan" : "Belum eligible (Min 1 tahun).")
    };

    // Skenario E: Pensiun/Resign
    res.scenarios.retire = {
        jhtBalance: jhtBalance,
        jhtDetails: jhtDetailsContent,
        jpMonthly: (segment === 'PU' && tenure >= 15) ? (0.01 * tenure * Math.min(currentIncome, JP_MAX_WAGE_2025)) : 0,
        jpMonthlyDetails: jpMonthlyDetails,
        jpLumpsum: (segment === 'PU' && tenure < 15) ? jpBalance : 0,
        jpLumpSumDetails: jpLumpSumDetails,
        notes: segment === 'BPU' 
            ? "BPU tidak mendapatkan JP (hanya JHT)." 
            : (tenure >= 15 ? "Mendapat Pensiun Bulanan Berkala." : "Masa iur < 15 tahun, JP cair sekaligus (Lump Sum).")
    };

    setResults(res);
  };

  // --- SUB-COMPONENTS ---

  const SegmentTab = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setSegment(id)}
      className={`flex-1 flex flex-col items-center justify-center p-3 transition-all ${
        segment === id 
          ? 'bg-blue-600 text-white shadow-lg transform scale-105 rounded-xl' 
          : 'bg-white text-gray-500 hover:bg-blue-50 rounded-xl border border-gray-100'
      }`}
    >
      <Icon size={20} className="mb-1" />
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );

  const RiskButton = ({ id, icon: Icon, label, color }) => (
    <button
        onClick={() => setRiskScenario(id)}
        className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
            riskScenario === id 
            ? `bg-${color}-50 border-${color}-500 text-${color}-700 ring-2 ring-${color}-200`
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
    >
        <Icon size={24} />
        <span className="text-xs font-bold text-center">{label}</span>
    </button>
  );

  // --- CONTENT RENDERING ---

  const renderScenarioResult = () => {
    if (!results) return null;
    const sc = results.scenarios;

    if (riskScenario === 'contribution') {
        return (
            <div className="space-y-4 animate-in fade-in">
                 {/* Split Card for Worker vs Company */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                        <p className="text-xs font-semibold text-blue-600 uppercase mb-1">
                            {segment === 'PMI' ? 'Total Biaya Wajib' : 'Dibayar Pekerja'}
                        </p>
                        <span className="text-2xl font-bold text-gray-800 block">{formatIDR(results.monthly.workerPay || 0)}</span>
                        <span className="text-xs text-gray-500">
                            {segment === 'PU' ? '/ bulan (Potong Gaji)' : segment === 'PMI' ? '(Paket + JHT jika ada)' : '/ bulan'}
                        </span>
                     </div>
                     {segment === 'PU' || segment === 'JAKON' ? (
                         <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                            <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Dibayar Perusahaan</p>
                            <span className="text-2xl font-bold text-gray-800 block">{formatIDR(results.monthly.companyPay || 0)}</span>
                            <span className="text-xs text-gray-500">/ bulan</span>
                         </div>
                     ) : null}
                 </div>

                <div className="bg-white rounded-xl border p-4 space-y-2">
                    <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                        <Info size={14}/> Rincian Alokasi (Klik untuk Detail)
                    </h4>
                    {results.monthly.details.map((d, i) => (
                        <div key={i} className="border-b last:border-0 border-dashed border-gray-100">
                            <button 
                                onClick={() => setExpandedDetail(expandedDetail === i ? null : i)}
                                className="w-full flex justify-between text-sm py-2 text-left hover:bg-gray-50 px-2 rounded"
                            >
                                <div>
                                    <span className="block text-gray-700 font-medium">{d.name}</span>
                                    <span className="text-xs text-gray-400">{d.split}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold block">{formatIDR(d.amount)}</span>
                                    {expandedDetail === i ? <ChevronUp size={12} className="inline"/> : <ChevronDown size={12} className="inline"/>}
                                </div>
                            </button>
                            {expandedDetail === i && (
                                <div className="px-2 pb-2 text-xs text-blue-600 bg-blue-50 rounded mb-1">
                                    <strong>Rumus:</strong> {d.formula}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* NEW: Total Tenure Cost Breakdown */}
                    {segment !== 'JAKON' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                             <h4 className="font-bold text-gray-800 text-sm mb-2">Akumulasi Iuran Selama {tenure} Tahun</h4>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded-lg">
                                    <span className="text-gray-600">Total Dibayar Pekerja:</span>
                                    <span className="font-bold text-blue-700">
                                        {segment === 'PMI' 
                                            ? formatIDR(results.monthly.pmiTotalAccumulated) 
                                            : formatIDR(results.monthly.workerPay * 12 * tenure)
                                        }
                                    </span>
                                </div>
                                {segment === 'PMI' && (
                                    <div className="text-xs text-gray-500 px-2 italic">
                                        Rincian PMI: {results.monthly.pmiCalcDetails}
                                    </div>
                                )}
                                {segment === 'PU' && (
                                    <div className="flex justify-between items-center text-sm bg-orange-50 p-2 rounded-lg">
                                        <span className="text-gray-600">Total Dibayar Perusahaan:</span>
                                        <span className="font-bold text-orange-700">
                                            {formatIDR(results.monthly.companyPay * 12 * tenure)}
                                        </span>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (riskScenario === 'death_normal') {
        const data = sc.death_normal;
        return (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-gray-800 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-sm opacity-80 mb-1">Total Manfaat Diterima Ahli Waris</p>
                    <h3 className="text-3xl font-bold text-blue-400">{formatIDR(data.total)}</h3>
                    <p className="text-xs mt-2 text-gray-300 italic">{data.notes}</p>
                </div>
                
                {/* Scholarship Toggle */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Baby size={18} className="text-blue-600" />
                        <span className="text-sm font-medium">Jumlah Anak Sekolah:</span>
                    </div>
                    <div className="flex gap-2 w-full">
                         <button 
                            onClick={() => setScholarshipKids(0)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 0 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            0 Anak
                         </button>
                         <button 
                            onClick={() => setScholarshipKids(1)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            1 Anak
                         </button>
                         <button 
                            onClick={() => setScholarshipKids(2)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 2 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            2 Anak (Max)
                         </button>
                    </div>
                </div>

                <div className="space-y-2">
                     <BenefitItem 
                        label="Manfaat JKM (Total)" 
                        amount={data.lumpsum} 
                        details={data.lumpsumDetails}
                     />
                     <BenefitItem 
                        label={`Beasiswa (${scholarshipKids} Anak)`} 
                        amount={data.scholarship} 
                        highlight={data.scholarship > 0} 
                        details={data.scholarshipDetails}
                     />
                     {/* Show JHT if applicable */}
                     {(segment === 'PU' || segment === 'BPU' || (segment === 'PMI' && pmiJhtEnabled)) && (
                        <BenefitItem 
                            label={`Saldo JHT (${tenure} thn + bunga)`} 
                            amount={data.jhtBalance} 
                            details={data.jhtDetails}
                        />
                     )}
                     {segment === 'PU' && (
                        <BenefitItem 
                            label="Saldo JP (Lump Sum)" 
                            amount={data.jpBalance} 
                            details={data.jpDetails}
                        />
                     )}
                </div>
            </div>
        );
    }

    if (riskScenario === 'death_work') {
        const data = sc.death_work;
        return (
             <div className="space-y-4 animate-in fade-in">
                <div className="bg-red-900 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-sm opacity-80 mb-1">Total Manfaat Kecelakaan Kerja (Meninggal)</p>
                    <h3 className="text-3xl font-bold text-yellow-400">{formatIDR(data.total)}</h3>
                    <p className="text-xs mt-2 text-gray-300 italic">{data.notes}</p>
                </div>
                 {/* Scholarship Toggle */}
                 <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Baby size={18} className="text-red-600" />
                        <span className="text-sm font-medium">Jumlah Anak Sekolah:</span>
                    </div>
                    <div className="flex gap-2 w-full">
                         <button 
                            onClick={() => setScholarshipKids(0)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 0 ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            0 Anak
                         </button>
                         <button 
                            onClick={() => setScholarshipKids(1)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 1 ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            1 Anak
                         </button>
                         <button 
                            onClick={() => setScholarshipKids(2)}
                            className={`flex-1 py-1 text-xs rounded-full border ${scholarshipKids === 2 ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}
                         >
                            2 Anak (Max)
                         </button>
                    </div>
                </div>
                <div className="space-y-2">
                     <BenefitItem 
                        label="Santunan JKK Meninggal" 
                        amount={data.jkkDeathTotal} 
                        details={data.jkkDeathDetails}
                     />
                     <BenefitItem 
                        label={`Beasiswa (${scholarshipKids} Anak)`} 
                        amount={data.scholarship} 
                        details={data.scholarshipDetails}
                     />
                     {(segment === 'PU' || segment === 'BPU' || (segment === 'PMI' && pmiJhtEnabled)) && (
                        <BenefitItem 
                            label="Saldo JHT" 
                            amount={data.jhtBalance} 
                            details={data.jhtDetails}
                        />
                     )}
                     {segment === 'PU' && (
                        <BenefitItem 
                            label="Saldo JP" 
                            amount={data.jpBalance} 
                            details={data.jpDetails} 
                        />
                     )}
                </div>
            </div>
        );
    }

    if (riskScenario === 'layover') {
        const data = sc.layover;
        if (!data.eligible && segment === 'PU') {
            return <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">Maaf, manfaat JKP Tunai hanya untuk kepesertaan minimal 12 bulan. Durasi Anda saat ini {tenure} tahun.</div>;
        }
        if (segment !== 'PU') {
             return <div className="p-4 bg-gray-100 text-gray-500 rounded-lg text-sm">Program JKP (Uang Tunai) hanya tersedia untuk segmen Penerima Upah (PU).</div>;
        }
        return (
             <div className="space-y-4 animate-in fade-in">
                <div className="bg-orange-600 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-sm opacity-80 mb-1">Total Estimasi Uang Tunai (PHK)</p>
                    <h3 className="text-3xl font-bold text-white">{formatIDR(data.total)}</h3>
                    <p className="text-xs mt-2 text-white/80 italic">{data.notes}</p>
                </div>

                <div className="space-y-2 mt-2">
                     <BenefitItem 
                        label="Uang Tunai JKP (6 Bulan)" 
                        amount={data.cash}
                        details={data.jkpDetails} 
                     />
                     <BenefitItem 
                        label="Pencairan Saldo JHT 100%" 
                        amount={data.jhtBalance} 
                        details={data.jhtDetails}
                     />
                </div>
                
                <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 mt-2">
                    *JHT bisa dicairkan 1 bulan setelah status non-aktif. JKP cair bertahap tiap bulan selama 6 bulan.
                </div>
            </div>
        );
    }

    if (riskScenario === 'retire') {
        const data = sc.retire;
        return (
             <div className="space-y-4 animate-in fade-in">
                <div className="bg-blue-700 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-sm opacity-80 mb-1">Total Saldo Hari Tua (JHT)</p>
                    <h3 className="text-3xl font-bold text-white">{formatIDR(data.jhtBalance)}</h3>
                    <p className="text-xs mt-2 text-white/80 italic">Estimasi pengembangan {annualYield}% p.a selama {tenure} tahun</p>
                </div>

                {/* Updated JHT with Accordion */}
                <div className="space-y-2">
                    {(segment === 'PU' || segment === 'BPU' || (segment === 'PMI' && pmiJhtEnabled)) ? (
                        <BenefitItem 
                            label="Rincian Saldo JHT" 
                            amount={data.jhtBalance} 
                            details={data.jhtDetails}
                            highlight
                        />
                    ) : (
                        <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-500 italic mt-2 text-center">
                            Tidak mengikuti program JHT.
                        </div>
                    )}
                </div>
                
                {segment === 'PU' ? (
                     <div className="bg-white border-2 border-blue-100 p-4 rounded-xl mt-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">Manfaat Pensiun (JP)</p>
                        {tenure >= 15 ? (
                             <div>
                                <p className="text-2xl font-bold text-blue-600">{formatIDR(data.jpMonthly)} <span className="text-sm text-gray-500">/ bulan</span></p>
                                <BenefitItem 
                                    label="Info Pembayaran Berkala" 
                                    amount="Seumur Hidup" 
                                    isNonCash
                                    details={data.jpMonthlyDetails}
                                />
                             </div>
                        ) : (
                            <div>
                                 <p className="text-2xl font-bold text-gray-600 mb-2">{formatIDR(data.jpLumpsum)}</p>
                                 <BenefitItem 
                                    label="Rincian JP (Lump Sum)" 
                                    amount={data.jpLumpsum} 
                                    details={data.jpLumpSumDetails}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-500 italic mt-2">
                        Peserta {segment === 'BPU' ? 'Bukan Penerima Upah (BPU)' : segment === 'PMI' ? 'Pekerja Migran (PMI)' : 'Jasa Konstruksi'} tidak mendapatkan manfaat Jaminan Pensiun (JP).
                    </div>
                )}
            </div>
        );
    }
    
    // Default Sick
    const data = sc.sick;
    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white border-l-4 border-red-500 p-4 shadow-sm rounded-r-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Biaya Pengobatan & Perawatan</p>
                <p className="text-xl font-bold text-gray-800">Sampai Sembuh (Sesuai Kebutuhan Medis)</p>
                <p className="text-xs text-gray-600 mt-1">
                    Ditanggung penuh tanpa batas biaya sesuai indikasi medis (PP No. 82/2019) di Pusat Layanan Kecelakaan Kerja (PLKK).
                </p>
            </div>
             <div className="bg-white border-l-4 border-orange-500 p-4 shadow-sm rounded-r-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Gaji Selama Sakit (STMB)</p>
                <div className="p-2">
                    {data.stmbDetails}
                </div>
            </div>
             <div className="bg-white border-l-4 border-blue-500 p-4 shadow-sm rounded-r-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Ganti Transportasi</p>
                <div className="p-2">
                    {data.transportDetails}
                </div>
            </div>
        </div>
    );
  };

  const renderInfoTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Informasi Program & Manfaat
        </h3>
        <div className="space-y-4">

            {/* 1. JKK */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Jaminan Kecelakaan Kerja (JKK)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Lingkup:</strong> Kecelakaan kerja, perjalanan dinas, WFH, penyakit akibat kerja (PAK).</p>
                    <p>• <strong>Biaya Pengobatan:</strong> Unlimited (sesuai kebutuhan medis).</p>
                    <p>• <strong>Santunan Meninggal:</strong> 48x Upah dilaporkan.</p>
                </div>
            </details>

            {/* 2. JKM (NEW) */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Jaminan Kematian (JKM)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Total Santunan:</strong> Rp 42.000.000 (Meninggal bukan karena kecelakaan kerja).</p>
                    <p>• <strong>Rincian:</strong> Santunan Kematian Rp 20jt, Berkala Rp 12jt, Pemakaman Rp 10jt.</p>
                    <p>• <strong>Syarat Beasiswa:</strong> Masa iur minimal 3 tahun.</p>
                </div>
            </details>
            
            {/* 3. JHT */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Jaminan Hari Tua (JHT)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Pencairan 100%:</strong> Usia Pensiun, Resign/PHK (Tunggu 1 bulan), Meninggal, Cacat Total, atau Meninggalkan RI.</p>
                    <p>• <strong>Pencairan Sebagian:</strong> Minimal kepesertaan 10 tahun. 30% untuk Perumahan, 10% keperluan lain (persiapan pensiun).</p>
                    <p>• <strong>Pajak:</strong> Saldo &le; 50jt (0%), &gt; 50jt (5% Final).</p>
                </div>
            </details>

            {/* 4. JP (NEW) */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Jaminan Pensiun (JP)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Konsep:</strong> Mempertahankan derajat kehidupan yang layak saat peserta kehilangan penghasilan karena pensiun/cacat total.</p>
                    <p>• <strong>Usia Pensiun:</strong> 59 Tahun (mulai 2025), bertambah 1 tahun setiap 3 tahun hingga mencapai 65 tahun.</p>
                    <p>• <strong>Manfaat Berkala:</strong> Diberikan jika masa iur minimal 15 tahun (180 bulan).</p>
                    <p>• <strong>Lump Sum:</strong> Diberikan jika masa iur kurang dari 15 tahun.</p>
                </div>
            </details>

            {/* 5. JKP */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Jaminan Kehilangan Pekerjaan (JKP)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Syarat:</strong> Mengalami PHK, WNI belum berusia 54 tahun pada saat mendaftar, PKWT/PKWTT.</p>
                    <p>• <strong>Masa Iur:</strong> Minimal 12 bulan dalam 24 bulan.</p>
                    <p>• <strong>Manfaat:</strong> Uang tunai 60% upah selama 6 bulan, Akses Pasar Kerja, dan Pelatihan Kerja.</p>
                </div>
            </details>

            {/* 6. MLT (NEW) */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Manfaat Layanan Tambahan (MLT)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pl-2 border-l-2 border-blue-200">
                    <p>• <strong>Fasilitas Pembiayaan Perumahan:</strong> Bekerja sama dengan Bank Penyalur (BTN, dll).</p>
                    <p>• <strong>Pinjaman Uang Muka (PUMP):</strong> Maks Rp 150 Juta.</p>
                    <p>• <strong>Kredit Pemilikan Rumah (KPR):</strong> Maks Rp 500 Juta.</p>
                    <p>• <strong>Pinjaman Renovasi (PRP):</strong> Maks Rp 200 Juta.</p>
                    <p>• <strong>Syarat:</strong> Peserta aktif minimal 1 tahun, tertib administrasi, belum punya rumah (untuk KPR/PUMP).</p>
                </div>
            </details>

            {/* 7. SCHOLARSHIP TABLE (CONVERTED TO ACCORDION) */}
            <details className="group border rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-gray-700 flex justify-between items-center list-none">
                    Tabel Manfaat Beasiswa (JKK & JKM)
                    <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                </summary>
                <div className="mt-3 overflow-x-auto">
                   <table className="w-full text-sm text-left text-gray-600">
                       <thead className="text-xs text-gray-700 uppercase bg-blue-50">
                           <tr>
                               <th className="px-4 py-2">Jenjang Pendidikan</th>
                               <th className="px-4 py-2">Nominal / Tahun</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr className="bg-white border-b">
                               <td className="px-4 py-2">TK / SD</td>
                               <td className="px-4 py-2">Rp 1.500.000</td>
                           </tr>
                           <tr className="bg-white border-b">
                               <td className="px-4 py-2">SMP</td>
                               <td className="px-4 py-2">Rp 2.000.000</td>
                           </tr>
                           <tr className="bg-white border-b">
                               <td className="px-4 py-2">SMA / SMK</td>
                               <td className="px-4 py-2">Rp 3.000.000</td>
                           </tr>
                           <tr className="bg-white">
                               <td className="px-4 py-2">Perguruan Tinggi (S1)</td>
                               <td className="px-4 py-2">Rp 12.000.000</td>
                           </tr>
                       </tbody>
                   </table>
                   <p className="text-xs text-gray-500 mt-2 italic">*Maksimal untuk 2 orang anak.</p>
               </div>
            </details>

        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      {/* Header */}
      <div className="bg-blue-800 text-white pb-24 pt-8 px-6 shadow-xl rounded-b-[2.5rem]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              Simulator Iuran & Manfaat Program BPJS Ketenagakerjaan
            </h1>
            <p className="text-blue-200 text-xs mt-1">
              Powered by <a href="https://espeje.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">espeje.com</a> & <a href="https://link-gr.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">link-gr.id</a>
            </p>
          </div>
          <div className="hidden md:flex gap-2 bg-blue-900/30 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('simulation')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'simulation' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:bg-blue-700/50'}`}
             >
                Simulasi
             </button>
             <button 
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'info' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:bg-blue-700/50'}`}
             >
                Info & Syarat
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-16">
        
         {/* Mobile Tabs */}
        <div className="flex md:hidden bg-white p-1 rounded-xl shadow-md mb-4 mx-2">
            <button 
                onClick={() => setActiveTab('simulation')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab === 'simulation' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
             >
                Simulasi
             </button>
             <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab === 'info' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
             >
                Info
             </button>
        </div>

        {activeTab === 'info' ? renderInfoTab() : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-1 bg-gray-50">
                <div className="flex gap-2">
                  <SegmentTab id="PU" icon={Briefcase} label="Penerima Upah" />
                  <SegmentTab id="BPU" icon={Users} label="Bukan Penerima Upah/Mandiri" />
                  <SegmentTab id="JAKON" icon={HardHat} label="Konstruksi" />
                  <SegmentTab id="PMI" icon={Plane} label="Pekerja Migran Indonesia" />
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calculator size={18} className="text-blue-600"/> 
                    Parameter {segment}
                  </h3>
                  
                  {/* --- INPUT GAJI & LAINNYA --- */}
                  {segment === 'PU' && (
                    <div className="space-y-4">
                      {/* Separate Inputs for Base Salary and Fixed Allowance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Gaji Pokok</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">Rp</span>
                          <input 
                            type="number" 
                            value={baseSalary === 0 ? '' : baseSalary} 
                            onChange={(e) => setBaseSalary(Number(e.target.value))}
                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tunjangan Tetap</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">Rp</span>
                          <input 
                            type="number" 
                            value={fixedAllowance === 0 ? '' : fixedAllowance} 
                            onChange={(e) => setFixedAllowance(Number(e.target.value))}
                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                        {(baseSalary + fixedAllowance) > JP_MAX_WAGE_2025 && (
                            <p className="text-xs text-amber-600 mt-1">* Total Upah di atas Cap JP (Rp 10,5jt).</p>
                        )}
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>Total Upah (Dasar Iuran):</span>
                            <span className="font-bold">{formatIDR(baseSalary + fixedAllowance)}</span>
                        </div>
                      </div>

                      {/* NEW: TENURE INPUT */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Lama Bekerja / Masa Iur</span>
                            <span className="text-blue-600 font-bold">{tenure} Tahun</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="35" 
                            step="1"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0 thn</span>
                            <span>15 thn (JP Berkala)</span>
                            <span>35 thn</span>
                        </div>
                      </div>

                      {/* NEW: ANNUAL YIELD INPUT */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Estimasi Bunga JHT/JP per Tahun</span>
                            <span className="text-blue-600 font-bold">{annualYield}%</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.1"
                            value={annualYield}
                            onChange={(e) => setAnnualYield(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0% (Flat)</span>
                            <span>5.5% (Avg)</span>
                            <span>10% (High)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tingkat Risiko Kerja (JKK)</label>
                        <select 
                          value={jkkRiskIndex} 
                          onChange={(e) => setJkkRiskIndex(Number(e.target.value))}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          {JKK_RISK_RATES.map((risk, idx) => (
                            <option key={idx} value={idx}>{risk.label} ({risk.rate * 100}%)</option>
                          ))}
                        </select>
                        <div className="mt-2 p-3 bg-gray-50 rounded border text-xs text-gray-600 italic">
                            {JKK_RISK_RATES[jkkRiskIndex].desc}
                        </div>
                      </div>
                    </div>
                  )}

                  {segment === 'BPU' && (
                    <div className="space-y-4">
                       <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Penghasilan Dilaporkan</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">Rp</span>
                          <input 
                            type="number" 
                            value={bpuIncome === 0 ? '' : bpuIncome} 
                            onChange={(e) => setBpuIncome(Number(e.target.value))}
                            className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            *Masukkan rata-rata penghasilan per bulan.
                        </p>
                      </div>

                      {/* BPU JHT Option */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id="bpuJht"
                                checked={bpuJhtEnabled}
                                onChange={(e) => setBpuJhtEnabled(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <label htmlFor="bpuJht" className="text-sm font-bold text-gray-700 cursor-pointer">
                                  Ikut Program JHT (Sukarela)
                              </label>
                          </div>
                      </div>

                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Lama Kepesertaan</span>
                            <span className="text-blue-600 font-bold">{tenure} Tahun</span>
                        </label>
                        <input 
                            type="range" min="0" max="35" step="1"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                       {/* NEW: ANNUAL YIELD INPUT */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Estimasi Bunga JHT per Tahun</span>
                            <span className="text-blue-600 font-bold">{annualYield}%</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.1"
                            value={annualYield}
                            onChange={(e) => setAnnualYield(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0% (Flat)</span>
                            <span>5.5% (Avg)</span>
                            <span>10% (High)</span>
                        </div>
                      </div>

                    </div>
                  )}
                  
                  {segment === 'JAKON' && (
                      <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nilai Kontrak Proyek</label>
                            <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">Rp</span>
                            <input 
                                type="number" 
                                value={jakonValue === 0 ? '' : jakonValue} 
                                onChange={(e) => setJakonValue(Number(e.target.value))}
                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                            </div>
                        </div>
                      </div>
                  )}

                  {segment === 'PMI' && (
                       <div className="space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Pilihan Paket</label>
                        <select 
                          value={pmiPackageIndex} 
                          onChange={(e) => setPmiPackageIndex(Number(e.target.value))}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          {PMI_PACKAGES.map((pkg, idx) => (
                            <option key={idx} value={idx}>{pkg.label} - {formatIDR(pkg.price)}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                            <strong>Catatan:</strong> Paket PMI wajib di atas mencakup <strong>JKK & JKM</strong>. 
                        </p>
                      </div>

                      {/* PMI JHT Option */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                              <input 
                                type="checkbox" 
                                id="pmiJht"
                                checked={pmiJhtEnabled}
                                onChange={(e) => setPmiJhtEnabled(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <label htmlFor="pmiJht" className="text-sm font-bold text-gray-700 cursor-pointer">
                                  Ikut Program JHT (Sukarela)
                              </label>
                          </div>
                          
                          {pmiJhtEnabled && (
                              <div className="animate-in slide-in-from-top-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Penghasilan Dasar JHT (Per Bulan)
                                  </label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-2 text-gray-400 text-sm">Rp</span>
                                      <input 
                                        type="number" 
                                        value={pmiIncome === 0 ? '' : pmiIncome}
                                        onChange={(e) => setPmiIncome(Number(e.target.value))}
                                        className="w-full pl-9 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                      />
                                  </div>
                                  <p className="text-xs text-blue-600 mt-1">
                                      *Iuran JHT: 2% dari nominal ini ({formatIDR(pmiIncome * 0.02)}/bln).
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* PMI Tenure */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Lama Bekerja / Masa Iur</span>
                            <span className="text-blue-600 font-bold">{tenure} Tahun</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="35" 
                            step="1"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                       {/* NEW: ANNUAL YIELD INPUT */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Estimasi Bunga JHT per Tahun</span>
                            <span className="text-blue-600 font-bold">{annualYield}%</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.1"
                            value={annualYield}
                            onChange={(e) => setAnnualYield(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0% (Flat)</span>
                            <span>5.5% (Avg)</span>
                            <span>10% (High)</span>
                        </div>
                      </div>

                      </div>
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: SCENARIO & RESULTS */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* 1. SCENARIO SELECTOR */}
                <Card className="p-2">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <RiskButton id="contribution" icon={DollarSign} label="Cek Iuran" color="blue" />
                        <RiskButton id="death_normal" icon={Skull} label="Meninggal" color="gray" />
                        <RiskButton id="death_work" icon={AlertTriangle} label="Kecelakaan" color="red" />
                        <RiskButton id="sick" icon={HeartPulse} label="Sakit Kerja" color="orange" />
                        <RiskButton id="layover" icon={Briefcase} label="PHK / JKP" color="orange" />
                        <RiskButton id="retire" icon={Armchair} label="JHT / JP" color="blue" />
                    </div>
                </Card>

                {/* 2. DYNAMIC RESULT CARD */}
                <Card className="p-0">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                             {riskScenario === 'contribution' ? 'Simulasi Iuran' : 'Simulasi Saat Terjadi Risiko'}
                        </h3>
                        <Badge>{tenure} Tahun Bekerja</Badge>
                    </div>
                    <div className="p-6">
                        {renderScenarioResult()}
                    </div>
                </Card>

                {segment === 'PU' && riskScenario === 'retire' && (
                     <Card className="p-4 bg-blue-50 border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Home size={18}/> Manfaat Layanan Tambahan (Perumahan)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <span className="block text-gray-500 text-xs">Kredit Rumah (KPR)</span>
                                <span className="font-bold text-blue-700">Max Rp 500 Juta</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <span className="block text-gray-500 text-xs">Pinjaman Uang Muka</span>
                                <span className="font-bold text-blue-700">Max Rp 150 Juta</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <span className="block text-gray-500 text-xs">Renovasi Rumah</span>
                                <span className="font-bold text-blue-700">Max Rp 200 Juta</span>
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2 italic">*Syarat: Tertib administrasi & minimal kepesertaan 1 tahun.</p>
                     </Card>
                )}

            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-xs pb-4">
            <p>Perhitungan resmi mengacu pada Peraturan Perundangan terbaru.</p>
            <p>Estimasi manfaat uang tunai (JHT/JP) belum termasuk potongan Pajak (PPh 21) sesuai ketentuan berlaku.</p>
        </div>
      </div>
    </div>
  );
}
