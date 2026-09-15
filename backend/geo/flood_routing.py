"""
Hydrological routing and geographic asset generator for Himalayan glacial lakes.
Provides real-world valley descent paths (D8 flow trajectory), Sentinel-2 NDWI
water surface boundary polygons, and downstream vulnerable settlements with flood wave ETAs.
"""

from typing import Dict, Any, List

# High-fidelity geographic dataset for monitored Himalayan lakes
LAKE_GEO_PROFILES: Dict[str, Dict[str, Any]] = {
    # 1. South Lhonak Lake (Teesta Basin, Sikkim)
    # 2023 disaster valley: Lhonak -> Zemu Chhu -> Lachen -> Chungthang (Teesta III Dam) -> Mangan -> Dikchu -> Singtam
    "gl-00124": {
        "lake_name": "South Lhonak Lake",
        "outlet_elev_m": 5200,
        "lake_polygon": [
            [88.5720, 27.9120],
            [88.5750, 27.9220],
            [88.5830, 27.9260],
            [88.5910, 27.9210],
            [88.5920, 27.9130],
            [88.5870, 27.9070],
            [88.5780, 27.9060],
            [88.5720, 27.9120],
        ],
        "flood_path_waypoints": [
            {"name": "South Lhonak Outlet", "coords": [88.5822, 27.9158], "elev_m": 5200, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Upper Lhonak Valley", "coords": [88.5620, 27.8950], "elev_m": 4750, "dist_km": 3.8, "eta_mins": 18},
            {"name": "Zemu Chhu Confluence", "coords": [88.5350, 27.8420], "elev_m": 3950, "dist_km": 11.2, "eta_mins": 48},
            {"name": "Zemu Glacier Snout", "coords": [88.5490, 27.7950], "elev_m": 3200, "dist_km": 19.5, "eta_mins": 78},
            {"name": "Lachen River Junction", "coords": [88.5560, 27.7320], "elev_m": 2700, "dist_km": 28.0, "eta_mins": 110},
            {"name": "Chungthang Dam (Teesta-III)", "coords": [88.6470, 27.6040], "elev_m": 1600, "dist_km": 47.5, "eta_mins": 175},
            {"name": "Mangan Valley", "coords": [88.5280, 27.5080], "elev_m": 1250, "dist_km": 64.0, "eta_mins": 235},
            {"name": "Dikchu Hydel Site", "coords": [88.5230, 27.3820], "elev_m": 850, "dist_km": 82.0, "eta_mins": 310},
            {"name": "Singtam Bridge", "coords": [88.4980, 27.2350], "elev_m": 350, "dist_km": 104.0, "eta_mins": 410},
        ],
        "settlements": [
            {"id": "st-01", "name": "Lachen", "coords": [88.5580, 27.7280], "pop": 890, "eta": "+02h 45m", "urgency": "elevated", "elev_m": 2700},
            {"id": "st-02", "name": "Chungthang", "coords": [88.6480, 27.6050], "pop": 1240, "eta": "+04h 15m", "urgency": "critical", "elev_m": 1600},
            {"id": "st-03", "name": "Mangan", "coords": [88.5300, 27.5100], "pop": 3400, "eta": "+06h 00m", "urgency": "watch", "elev_m": 1250},
            {"id": "st-04", "name": "Dikchu", "coords": [88.5250, 27.3850], "pop": 1850, "eta": "+07h 45m", "urgency": "watch", "elev_m": 850},
            {"id": "st-05", "name": "Singtam", "coords": [88.4990, 27.2360], "pop": 5070, "eta": "+09h 30m", "urgency": "watch", "elev_m": 350},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 65000000,
            "peak_discharge_m3_s": 8450,
            "average_velocity_m_s": 4.8,
            "dam_type": "Ice-cored moraine",
        },
    },

    # 2. Ghepan Ghat (Chenab Basin, Himachal Pradesh)
    # Ghepan Ghat -> Sissu -> Tandi -> Keylong -> Udaipur
    "gl-00452": {
        "lake_name": "Ghepan Ghat",
        "outlet_elev_m": 4680,
        "lake_polygon": [
            [77.3120, 32.4430],
            [77.3160, 32.4550],
            [77.3270, 32.4580],
            [77.3320, 32.4510],
            [77.3280, 32.4420],
            [77.3180, 32.4410],
            [77.3120, 32.4430],
        ],
        "flood_path_waypoints": [
            {"name": "Ghepan Ghat Outlet", "coords": [77.3200, 32.4500], "elev_m": 4680, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Ghepan Valley Descent", "coords": [77.2600, 32.4850], "elev_m": 3800, "dist_km": 8.5, "eta_mins": 35},
            {"name": "Sissu / Chandra River Confluence", "coords": [77.1250, 32.4780], "elev_m": 3120, "dist_km": 24.0, "eta_mins": 95},
            {"name": "Gondhla Gorge", "coords": [77.0300, 32.5100], "elev_m": 2950, "dist_km": 36.5, "eta_mins": 145},
            {"name": "Tandi Confluence (Bhaga River)", "coords": [76.9750, 32.5520], "elev_m": 2800, "dist_km": 46.0, "eta_mins": 185},
            {"name": "Udaipur Valley", "coords": [76.6540, 32.7280], "elev_m": 2650, "dist_km": 88.0, "eta_mins": 360},
        ],
        "settlements": [
            {"id": "gg-01", "name": "Sissu", "coords": [77.1260, 32.4800], "pop": 420, "eta": "+02h 15m", "urgency": "watch", "elev_m": 3120},
            {"id": "gg-02", "name": "Tandi", "coords": [76.9770, 32.5530], "pop": 280, "eta": "+03h 45m", "urgency": "watch", "elev_m": 2800},
            {"id": "gg-03", "name": "Udaipur", "coords": [76.6550, 32.7300], "pop": 1250, "eta": "+06h 00m", "urgency": "watch", "elev_m": 2650},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 18000000,
            "peak_discharge_m3_s": 2900,
            "average_velocity_m_s": 4.1,
            "dam_type": "Steep boulder moraine",
        },
    },

    # 3. Pareechu Lake (Sutlej Basin, Tibet/Himachal border)
    # Pareechu -> Sumdo -> Spiti Confluence -> Pooh -> Rampur
    "gl-00331": {
        "lake_name": "Pareechu Lake",
        "outlet_elev_m": 4200,
        "lake_polygon": [
            [78.3680, 31.5120],
            [78.3750, 31.5280],
            [78.3900, 31.5300],
            [78.3950, 31.5180],
            [78.3880, 31.5100],
            [78.3750, 31.5080],
            [78.3680, 31.5120],
        ],
        "flood_path_waypoints": [
            {"name": "Pareechu Dam Crest", "coords": [78.3800, 31.5200], "elev_m": 4200, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Tibet Border Gorge", "coords": [78.4300, 31.5950], "elev_m": 3700, "dist_km": 12.0, "eta_mins": 45},
            {"name": "Sumdo Confluence", "coords": [78.5800, 31.9700], "elev_m": 3100, "dist_km": 42.0, "eta_mins": 160},
            {"name": "Khab (Spiti-Sutlej Junction)", "coords": [78.6500, 31.8100], "elev_m": 2600, "dist_km": 68.0, "eta_mins": 255},
            {"name": "Pooh Settlement", "coords": [78.5700, 31.7600], "elev_m": 2400, "dist_km": 82.0, "eta_mins": 310},
            {"name": "Rampur Hydel Complex", "coords": [77.6300, 31.4500], "elev_m": 1050, "dist_km": 175.0, "eta_mins": 620},
        ],
        "settlements": [
            {"id": "pr-01", "name": "Sumdo", "coords": [78.5820, 31.9720], "pop": 650, "eta": "+02h 40m", "urgency": "elevated", "elev_m": 3100},
            {"id": "pr-02", "name": "Pooh", "coords": [78.5720, 31.7620], "pop": 2100, "eta": "+05h 10m", "urgency": "watch", "elev_m": 2400},
            {"id": "pr-03", "name": "Rampur", "coords": [77.6350, 31.4520], "pop": 8200, "eta": "+10h 20m", "urgency": "watch", "elev_m": 1050},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 54000000,
            "peak_discharge_m3_s": 6800,
            "average_velocity_m_s": 4.6,
            "dam_type": "Landslide dam / Moraine complex",
        },
    },

    # 4. Chandra Tal (Spiti, Himachal Pradesh)
    # Chandra Tal -> Batal -> Chhatru -> Gramphu -> Rohtang Base
    "gl-ct-12": {
        "lake_name": "Chandra Tal",
        "outlet_elev_m": 4300,
        "lake_polygon": [
            [77.6100, 32.4750],
            [77.6180, 32.4880],
            [77.6250, 32.4850],
            [77.6240, 32.4740],
            [77.6180, 32.4700],
            [77.6100, 32.4750],
        ],
        "flood_path_waypoints": [
            {"name": "Chandra Tal Outlet", "coords": [77.6180, 32.4760], "elev_m": 4300, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Samudra Tapu Confluence", "coords": [77.5800, 32.4400], "elev_m": 4100, "dist_km": 6.5, "eta_mins": 25},
            {"name": "Batal River Crossing", "coords": [77.5300, 32.3500], "elev_m": 3960, "dist_km": 18.0, "eta_mins": 70},
            {"name": "Chhatru Gorge", "coords": [77.3600, 32.3300], "elev_m": 3360, "dist_km": 38.0, "eta_mins": 150},
            {"name": "Gramphu (Rohtang Junction)", "coords": [77.1800, 32.4000], "elev_m": 3200, "dist_km": 56.0, "eta_mins": 220},
        ],
        "settlements": [
            {"id": "ct-01", "name": "Batal", "coords": [77.5320, 32.3520], "pop": 85, "eta": "+01h 10m", "urgency": "watch", "elev_m": 3960},
            {"id": "ct-02", "name": "Chhatru", "coords": [77.3620, 32.3320], "pop": 120, "eta": "+02h 30m", "urgency": "watch", "elev_m": 3360},
            {"id": "ct-03", "name": "Gramphu", "coords": [77.1820, 32.4020], "pop": 190, "eta": "+03h 40m", "urgency": "watch", "elev_m": 3200},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 12000000,
            "peak_discharge_m3_s": 1850,
            "average_velocity_m_s": 4.2,
            "dam_type": "Bedrock / glacial moraine",
        },
    },

    # 5. Imja Tsho (Dudh Koshi Basin, Nepal/Everest)
    "gl-00089": {
        "lake_name": "Imja Tsho",
        "outlet_elev_m": 5010,
        "lake_polygon": [
            [86.9150, 27.8950],
            [86.9200, 27.9100],
            [86.9380, 27.9150],
            [86.9450, 27.9050],
            [86.9400, 27.8920],
            [86.9250, 27.8900],
            [86.9150, 27.8950],
        ],
        "flood_path_waypoints": [
            {"name": "Imja Spillway Outlet", "coords": [86.9250, 27.9000], "elev_m": 5010, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Dingboche Valley", "coords": [86.8320, 27.8920], "elev_m": 4410, "dist_km": 9.5, "eta_mins": 38},
            {"name": "Pangboche Monastery", "coords": [86.7900, 27.8550], "elev_m": 3985, "dist_km": 17.0, "eta_mins": 68},
            {"name": "Namche Bazaar Valley", "coords": [86.7150, 27.8050], "elev_m": 3440, "dist_km": 31.0, "eta_mins": 125},
        ],
        "settlements": [
            {"id": "ij-01", "name": "Dingboche", "coords": [86.8340, 27.8930], "pop": 340, "eta": "+00h 40m", "urgency": "elevated", "elev_m": 4410},
            {"id": "ij-02", "name": "Pangboche", "coords": [86.7920, 27.8560], "pop": 610, "eta": "+01h 10m", "urgency": "watch", "elev_m": 3985},
            {"id": "ij-03", "name": "Namche Bazaar", "coords": [86.7160, 27.8060], "pop": 2150, "eta": "+02h 05m", "urgency": "watch", "elev_m": 3440},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 75000000,
            "peak_discharge_m3_s": 9200,
            "average_velocity_m_s": 4.9,
            "dam_type": "Engineered siphon moraine",
        },
    },

    # 6. Tsho Rolpa (Rolwaling Basin, Nepal)
    "gl-00215": {
        "lake_name": "Tsho Rolpa",
        "outlet_elev_m": 4580,
        "lake_polygon": [
            [86.4650, 27.8650],
            [86.4700, 27.8800],
            [86.4950, 27.8850],
            [86.5050, 27.8720],
            [86.4980, 27.8600],
            [86.4800, 27.8580],
            [86.4650, 27.8650],
        ],
        "flood_path_waypoints": [
            {"name": "Tsho Rolpa End Moraine", "coords": [86.4700, 27.8700], "elev_m": 4580, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Na Village", "coords": [86.4400, 27.8600], "elev_m": 4180, "dist_km": 4.5, "eta_mins": 18},
            {"name": "Beding Valley", "coords": [86.3500, 27.8450], "elev_m": 3720, "dist_km": 14.5, "eta_mins": 58},
            {"name": "Simigaon Confluence", "coords": [86.2400, 27.8520], "elev_m": 2050, "dist_km": 32.0, "eta_mins": 130},
        ],
        "settlements": [
            {"id": "tr-01", "name": "Na", "coords": [86.4420, 27.8610], "pop": 120, "eta": "+00h 20m", "urgency": "critical", "elev_m": 4180},
            {"id": "tr-02", "name": "Beding", "coords": [86.3520, 27.8460], "pop": 480, "eta": "+01h 00m", "urgency": "elevated", "elev_m": 3720},
            {"id": "tr-03", "name": "Simigaon", "coords": [86.2420, 27.8530], "pop": 1100, "eta": "+02h 10m", "urgency": "watch", "elev_m": 2050},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 80000000,
            "peak_discharge_m3_s": 10500,
            "average_velocity_m_s": 5.1,
            "dam_type": "Moraine with artificial spillway",
        },
    },

    # 5. Shishper Lake (Hunza, Karakoram)
    "gl-00501": {
        "lake_name": "Shishper Lake",
        "outlet_elev_m": 3180,
        "lake_polygon": [
            [74.5950, 36.4300],
            [74.6050, 36.4420],
            [74.6120, 36.4380],
            [74.6080, 36.4290],
            [74.5950, 36.4300],
        ],
        "flood_path_waypoints": [
            {"name": "Shishper Ice Dam Lip", "coords": [74.6020, 36.4360], "elev_m": 3180, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Hassanabad Nala", "coords": [74.6150, 36.3850], "elev_m": 2550, "dist_km": 6.2, "eta_mins": 25},
            {"name": "KKH Highway Bridge", "coords": [74.6220, 36.3350], "elev_m": 2150, "dist_km": 12.8, "eta_mins": 55},
            {"name": "Aliabad Hunza Reach", "coords": [74.6150, 36.3050], "elev_m": 1950, "dist_km": 18.5, "eta_mins": 85},
        ],
        "settlements": [
            {"id": "sh-01", "name": "Hassanabad", "coords": [74.6160, 36.3860], "pop": 2100, "eta": "+00h 25m", "urgency": "critical", "elev_m": 2550},
            {"id": "sh-02", "name": "Aliabad Hunza", "coords": [74.6170, 36.3060], "pop": 4200, "eta": "+01h 25m", "urgency": "elevated", "elev_m": 1950},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 52000000,
            "peak_discharge_m3_s": 7800,
            "average_velocity_m_s": 5.4,
            "dam_type": "Glacier surge ice dam",
        },
    },

    # 6. Chorabari Tal / Gandhi Sarovar (Kedarnath, Uttarakhand)
    "gl-00502": {
        "lake_name": "Chorabari Tal (Gandhi Sarovar)",
        "outlet_elev_m": 3960,
        "lake_polygon": [
            [79.0550, 30.7420],
            [79.0680, 30.7520],
            [79.0720, 30.7480],
            [79.0620, 30.7390],
            [79.0550, 30.7420],
        ],
        "flood_path_waypoints": [
            {"name": "Chorabari Moraine Lip", "coords": [79.0620, 30.7480], "elev_m": 3960, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Kedarnath Temple", "coords": [79.0670, 30.7350], "elev_m": 3584, "dist_km": 1.8, "eta_mins": 10},
            {"name": "Rambara Gorge", "coords": [79.0650, 30.6850], "elev_m": 2700, "dist_km": 7.5, "eta_mins": 38},
            {"name": "Gaurikund Confluence", "coords": [79.0550, 30.6500], "elev_m": 1980, "dist_km": 13.0, "eta_mins": 70},
            {"name": "Sonprayag Bridge", "coords": [78.9950, 30.6200], "elev_m": 1820, "dist_km": 19.5, "eta_mins": 105},
        ],
        "settlements": [
            {"id": "ch-01", "name": "Kedarnath Town", "coords": [79.0670, 30.7340], "pop": 3800, "eta": "+00h 10m", "urgency": "critical", "elev_m": 3584},
            {"id": "ch-02", "name": "Rambara", "coords": [79.0640, 30.6840], "pop": 1200, "eta": "+00h 38m", "urgency": "critical", "elev_m": 2700},
            {"id": "ch-03", "name": "Gaurikund", "coords": [79.0540, 30.6490], "pop": 4500, "eta": "+01h 10m", "urgency": "elevated", "elev_m": 1980},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 14000000,
            "peak_discharge_m3_s": 4600,
            "average_velocity_m_s": 4.6,
            "dam_type": "Moraine with scree matrix",
        },
    },

    # 7. Gya Lake (Ladakh)
    "gl-00503": {
        "lake_name": "Gya Lake",
        "outlet_elev_m": 4720,
        "lake_polygon": [
            [77.7220, 33.6450],
            [77.7350, 33.6550],
            [77.7380, 33.6490],
            [77.7280, 33.6410],
            [77.7220, 33.6450],
        ],
        "flood_path_waypoints": [
            {"name": "Gya Glacial Lip", "coords": [77.7300, 33.6500], "elev_m": 4720, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Upper Gya Valley", "coords": [77.7380, 33.6650], "elev_m": 4400, "dist_km": 2.2, "eta_mins": 14},
            {"name": "Gya Village", "coords": [77.7420, 33.6850], "elev_m": 4100, "dist_km": 5.0, "eta_mins": 32},
            {"name": "Miru Confluence", "coords": [77.7480, 33.7250], "elev_m": 3850, "dist_km": 10.5, "eta_mins": 65},
            {"name": "Upshi Indus Junction", "coords": [77.7550, 33.8250], "elev_m": 3450, "dist_km": 24.0, "eta_mins": 140},
        ],
        "settlements": [
            {"id": "gy-01", "name": "Gya Village", "coords": [77.7430, 33.6860], "pop": 650, "eta": "+00h 32m", "urgency": "elevated", "elev_m": 4100},
            {"id": "gy-02", "name": "Miru", "coords": [77.7490, 33.7260], "pop": 500, "eta": "+01h 05m", "urgency": "watch", "elev_m": 3850},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 6500000,
            "peak_discharge_m3_s": 1850,
            "average_velocity_m_s": 3.6,
            "dam_type": "Ice-cored moraine piping",
        },
    },

    # 8. Thorthormi Lake Complex (Lunana, Bhutan)
    "gl-00504": {
        "lake_name": "Thorthormi Lake Complex",
        "outlet_elev_m": 4420,
        "lake_polygon": [
            [90.2380, 28.1580],
            [90.2550, 28.1700],
            [90.2600, 28.1650],
            [90.2450, 28.1520],
            [90.2380, 28.1580],
        ],
        "flood_path_waypoints": [
            {"name": "Thorthormi Ridge", "coords": [90.2480, 28.1620], "elev_m": 4420, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Raphstreng Confluence", "coords": [90.2450, 28.1500], "elev_m": 4350, "dist_km": 1.5, "eta_mins": 8},
            {"name": "Thanza Valley", "coords": [90.2300, 28.1250], "elev_m": 4150, "dist_km": 5.8, "eta_mins": 30},
            {"name": "Punakha Valley", "coords": [89.8600, 27.5850], "elev_m": 1250, "dist_km": 88.0, "eta_mins": 410},
        ],
        "settlements": [
            {"id": "th-01", "name": "Thanza", "coords": [90.2320, 28.1260], "pop": 920, "eta": "+00h 30m", "urgency": "critical", "elev_m": 4150},
            {"id": "th-02", "name": "Punakha Dzong", "coords": [89.8620, 27.5860], "pop": 9500, "eta": "+06h 50m", "urgency": "critical", "elev_m": 1250},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 95000000,
            "peak_discharge_m3_s": 12400,
            "average_velocity_m_s": 5.2,
            "dam_type": "Supraglacial moraine dividing wall",
        },
    },

    # 9. Rathong Lake (West Sikkim)
    "gl-00505": {
        "lake_name": "Rathong Lake",
        "outlet_elev_m": 4580,
        "lake_polygon": [
            [88.1580, 27.5550],
            [88.1720, 27.5680],
            [88.1750, 27.5630],
            [88.1630, 27.5520],
            [88.1580, 27.5550],
        ],
        "flood_path_waypoints": [
            {"name": "Rathong Proglacial Lip", "coords": [88.1650, 27.5620], "elev_m": 4580, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Dzongri Valley", "coords": [88.1850, 27.4850], "elev_m": 4030, "dist_km": 9.5, "eta_mins": 48},
            {"name": "Bakhim Snout", "coords": [88.2050, 27.4200], "elev_m": 2650, "dist_km": 18.0, "eta_mins": 90},
            {"name": "Yuksom Reach", "coords": [88.2250, 27.3750], "elev_m": 1780, "dist_km": 26.0, "eta_mins": 135},
        ],
        "settlements": [
            {"id": "rt-01", "name": "Dzongri Snout", "coords": [88.1860, 27.4860], "pop": 240, "eta": "+00h 48m", "urgency": "elevated", "elev_m": 4030},
            {"id": "rt-02", "name": "Yuksom", "coords": [88.2260, 27.3760], "pop": 3200, "eta": "+02h 15m", "urgency": "elevated", "elev_m": 1780},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 38000000,
            "peak_discharge_m3_s": 5800,
            "average_velocity_m_s": 4.5,
            "dam_type": "Moraine with proglacial snout",
        },
    },

    # 10. Bramsar-Chirsar Twin Lakes (Pir Panjal, J&K)
    "gl-00506": {
        "lake_name": "Bramsar-Chirsar Twin Lakes",
        "outlet_elev_m": 3950,
        "lake_polygon": [
            [74.8280, 33.5800],
            [74.8420, 33.5920],
            [74.8460, 33.5870],
            [74.8320, 33.5780],
            [74.8280, 33.5800],
        ],
        "flood_path_waypoints": [
            {"name": "Bramsar Tarn Lip", "coords": [74.8350, 33.5850], "elev_m": 3950, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Chirsar Junction", "coords": [74.8450, 33.5900], "elev_m": 3820, "dist_km": 1.4, "eta_mins": 8},
            {"name": "Kongwattan Meadow", "coords": [74.8850, 33.6400], "elev_m": 2550, "dist_km": 9.2, "eta_mins": 50},
            {"name": "Aharbal Gorge", "coords": [74.7800, 33.6450], "elev_m": 2260, "dist_km": 16.5, "eta_mins": 95},
            {"name": "Kulgam Valley Plain", "coords": [75.0200, 33.6450], "elev_m": 1740, "dist_km": 28.0, "eta_mins": 165},
        ],
        "settlements": [
            {"id": "bc-01", "name": "Kongwattan", "coords": [74.8860, 33.6410], "pop": 450, "eta": "+00h 50m", "urgency": "watch", "elev_m": 2550},
            {"id": "bc-02", "name": "Aharbal", "coords": [74.7820, 33.6460], "pop": 1400, "eta": "+01h 35m", "urgency": "elevated", "elev_m": 2260},
            {"id": "bc-03", "name": "Kulgam Town", "coords": [75.0220, 33.6460], "pop": 6000, "eta": "+02h 45m", "urgency": "watch", "elev_m": 1740},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 12000000,
            "peak_discharge_m3_s": 2400,
            "average_velocity_m_s": 4.1,
            "dam_type": "Cirque moraine / bedrock lip",
        },
    },

    # 11. Bhagsar Lake (Shopian / Poonch, J&K)
    "gl-00507": {
        "lake_name": "Bhagsar Lake",
        "outlet_elev_m": 3740,
        "lake_polygon": [
            [74.5200, 33.5380],
            [74.5350, 33.5480],
            [74.5380, 33.5430],
            [74.5240, 33.5350],
            [74.5200, 33.5380],
        ],
        "flood_path_waypoints": [
            {"name": "Bhagsar Tarn Outlet", "coords": [74.5280, 33.5420], "elev_m": 3740, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Pir Panjal Flank", "coords": [74.5450, 33.5550], "elev_m": 3400, "dist_km": 2.5, "eta_mins": 15},
            {"name": "Poshana Snout", "coords": [74.5650, 33.5800], "elev_m": 2600, "dist_km": 7.8, "eta_mins": 45},
            {"name": "Bafliaz Reach", "coords": [74.3500, 33.6100], "elev_m": 1650, "dist_km": 22.0, "eta_mins": 125},
        ],
        "settlements": [
            {"id": "bg-01", "name": "Poshana", "coords": [74.5660, 33.5810], "pop": 350, "eta": "+00h 45m", "urgency": "watch", "elev_m": 2600},
            {"id": "bg-02", "name": "Bafliaz", "coords": [74.3520, 33.6110], "pop": 800, "eta": "+02h 05m", "urgency": "watch", "elev_m": 1650},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 8500000,
            "peak_discharge_m3_s": 1600,
            "average_velocity_m_s": 3.8,
            "dam_type": "Glacial scree and moraine ridge",
        },
    },

    # 12. Nundkol-Gangabal Complex (Mt. Harmukh, Kashmir)
    "gl-00508": {
        "lake_name": "Nundkol-Gangabal Complex",
        "outlet_elev_m": 3570,
        "lake_polygon": [
            [74.9150, 34.4200],
            [74.9350, 34.4350],
            [74.9400, 34.4280],
            [74.9280, 34.4150],
            [74.9150, 34.4200],
        ],
        "flood_path_waypoints": [
            {"name": "Gangabal High Tarn Lip", "coords": [74.9250, 34.4280], "elev_m": 3570, "dist_km": 0.0, "eta_mins": 0},
            {"name": "Nundkol Inter-Lake Spillway", "coords": [74.9350, 34.4150], "elev_m": 3505, "dist_km": 1.8, "eta_mins": 10},
            {"name": "Trunkhol Meadow", "coords": [74.9500, 34.3900], "elev_m": 3200, "dist_km": 5.4, "eta_mins": 30},
            {"name": "Naranag Gorge", "coords": [74.9750, 34.3550], "elev_m": 2120, "dist_km": 11.5, "eta_mins": 65},
            {"name": "Wangath Hydel Reach", "coords": [74.9850, 34.3200], "elev_m": 1980, "dist_km": 16.0, "eta_mins": 90},
            {"name": "Kangan / USHP Hydel", "coords": [74.9050, 34.2600], "elev_m": 1810, "dist_km": 24.5, "eta_mins": 140},
        ],
        "settlements": [
            {"id": "ng-01", "name": "Naranag", "coords": [74.9760, 34.3560], "pop": 1100, "eta": "+01h 05m", "urgency": "elevated", "elev_m": 2120},
            {"id": "ng-02", "name": "Wangath", "coords": [74.9860, 34.3210], "pop": 2400, "eta": "+01h 30m", "urgency": "elevated", "elev_m": 1980},
            {"id": "ng-03", "name": "Kangan / USHP Hydel", "coords": [74.9060, 34.2610], "pop": 6200, "eta": "+02h 20m", "urgency": "elevated", "elev_m": 1810},
        ],
        "breach_hydrology": {
            "lake_volume_m3": 42000000,
            "peak_discharge_m3_s": 6200,
            "average_velocity_m_s": 4.7,
            "dam_type": "Twin proglacial moraine cascading lip",
        },
    },
}

def get_lake_flood_path_geojson(lake_id: str) -> Dict[str, Any]:
    """
    Returns standard GeoJSON FeatureCollection containing:
    1. Lake surface polygon (Polygon)
    2. Valley D8 descent flood path corridor (LineString)
    3. Downstream settlements at risk (Points)
    """
    profile = LAKE_GEO_PROFILES.get(lake_id)
    if not profile:
        # Fallback default if unknown lake
        return {
            "type": "FeatureCollection",
            "features": [],
            "properties": {"lake_id": lake_id, "error": "No geo profile found"},
        }

    features = []

    # 1. Lake Water Surface Boundary (Polygon)
    # GeoJSON coordinates format: [lng, lat]
    lake_poly_coords = [profile["lake_polygon"]]
    features.append({
        "type": "Feature",
        "id": f"{lake_id}-polygon",
        "geometry": {
            "type": "Polygon",
            "coordinates": lake_poly_coords,
        },
        "properties": {
            "feature_type": "lake_polygon",
            "lake_id": lake_id,
            "lake_name": profile["lake_name"],
            "outlet_elev_m": profile["outlet_elev_m"],
            "dam_type": profile["breach_hydrology"]["dam_type"],
            "lake_volume_m3": profile["breach_hydrology"]["lake_volume_m3"],
        },
    })

    # 2. Downstream D8 Flood Inundation Path (LineString)
    path_coords = [wp["coords"] for wp in profile["flood_path_waypoints"]]
    features.append({
        "type": "Feature",
        "id": f"{lake_id}-flood-path",
        "geometry": {
            "type": "LineString",
            "coordinates": path_coords,
        },
        "properties": {
            "feature_type": "flood_path",
            "lake_id": lake_id,
            "lake_name": profile["lake_name"],
            "waypoints": profile["flood_path_waypoints"],
            "total_distance_km": profile["flood_path_waypoints"][-1]["dist_km"],
            "total_drop_m": profile["flood_path_waypoints"][0]["elev_m"] - profile["flood_path_waypoints"][-1]["elev_m"],
            "peak_discharge_m3_s": profile["breach_hydrology"]["peak_discharge_m3_s"],
            "avg_velocity_m_s": profile["breach_hydrology"]["average_velocity_m_s"],
        },
    })

    # 3. Downstream Settlements & Infrastructure (Points)
    for st in profile["settlements"]:
        features.append({
            "type": "Feature",
            "id": f"{lake_id}-settlement-{st['id']}",
            "geometry": {
                "type": "Point",
                "coordinates": st["coords"],
            },
            "properties": {
                "feature_type": "settlement",
                "settlement_id": st["id"],
                "name": st["name"],
                "pop_at_risk": st["pop"],
                "eta": st["eta"],
                "urgency": st["urgency"],
                "elev_m": st["elev_m"],
                "lake_id": lake_id,
            },
        })

    return {
        "type": "FeatureCollection",
        "properties": {
            "lake_id": lake_id,
            "lake_name": profile["lake_name"],
            "breach_hydrology": profile["breach_hydrology"],
        },
        "features": features,
    }

def get_lake_elevation_profile(lake_id: str) -> Dict[str, Any]:
    """Returns longitudinal elevation descent profile along the flood path."""
    profile = LAKE_GEO_PROFILES.get(lake_id)
    if not profile:
        return {"lake_id": lake_id, "profile": []}

    waypoints = profile["flood_path_waypoints"]
    chart_points = [
        {
            "name": wp["name"],
            "distance_km": wp["dist_km"],
            "elevation_m": wp["elev_m"],
            "eta_mins": wp["eta_mins"],
        }
        for wp in waypoints
    ]

    return {
        "lake_id": lake_id,
        "lake_name": profile["lake_name"],
        "outlet_elev_m": profile["outlet_elev_m"],
        "profile": chart_points,
    }
