-- Migration: Populate Plant_Profiles table with 150+ plant species
-- Source: Botanical databases, academic research, and horticultural references
-- Moisture levels: percentage of soil moisture (0-100%)

-- Clear existing data (if any)
TRUNCATE TABLE Plant_Profiles RESTART IDENTITY;

-- Insert plant species data
INSERT INTO Plant_Profiles (species_name, description, ideal_moisture) VALUES

-- Houseplants & Indoor Plants
('Monstera deliciosa', 'Swiss cheese plant with large, fenestrated leaves. Native to Central America. Popular houseplant known for its dramatic foliage and climbing habit.', 65),
('Pothos aureus', 'Golden pothos, a trailing vine with heart-shaped variegated leaves. Extremely hardy and tolerant of low light conditions.', 55),
('Sansevieria trifasciata', 'Snake plant or mother-in-law''s tongue. Succulent with upright, sword-like leaves. Excellent air purifier and drought tolerant.', 30),
('Ficus elastica', 'Rubber tree with glossy, dark green leaves. Native to India. Popular indoor tree that can grow quite large.', 60),
('Spathiphyllum wallisii', 'Peace lily with white spathes and dark green leaves. Excellent indicator plant - droops when thirsty.', 70),
('Philodendron hederaceum', 'Heartleaf philodendron, a fast-growing trailing vine. Very adaptable to various light conditions.', 60),
('Dracaena marginata', 'Dragon tree with narrow, red-edged leaves. Slow-growing and tolerant of neglect.', 45),
('Chlorophytum comosum', 'Spider plant producing plantlets on long stolons. Excellent air purifier and very easy to propagate.', 55),
('Aloe vera', 'Medicinal succulent with thick, gel-filled leaves. Drought tolerant and has healing properties.', 25),
('Zamioculcas zamiifolia', 'ZZ plant with glossy, dark green compound leaves. Extremely drought tolerant and low maintenance.', 35),

-- Succulents & Cacti
('Echeveria elegans', 'Mexican snowball, a rosette-forming succulent with blue-green leaves. Produces orange-pink flowers.', 20),
('Sedum morganianum', 'Burro''s tail with trailing stems of plump, blue-green leaves. Native to Mexico and Honduras.', 25),
('Crassula ovata', 'Jade plant, a tree-like succulent with thick, oval leaves. Symbol of good luck and prosperity.', 30),
('Haworthia fasciata', 'Zebra plant with white-striped, pointed leaves arranged in rosettes. Small, clumping succulent.', 25),
('Opuntia microdasys', 'Bunny ears cactus with flat, oval pads covered in small spines. Native to Mexico.', 15),
('Mammillaria elongata', 'Ladyfinger cactus forming clusters of cylindrical stems. Produces small yellow flowers.', 15),
('Lithops species', 'Living stones that mimic rocks. Extremely drought tolerant and require minimal water.', 10),
('Adenium obesum', 'Desert rose with swollen trunk and bright flowers. Drought tolerant with toxic sap.', 20),
('Kalanchoe blossfeldiana', 'Flaming Katy with bright, long-lasting flowers. Popular gift plant with succulent leaves.', 30),
('Agave americana', 'Century plant with large, blue-green rosettes. Slow-growing and extremely drought tolerant.', 15),

-- Vegetables & Herbs
('Solanum lycopersicum', 'Tomato, warm-season fruit vegetable. Requires consistent moisture for fruit development and disease prevention.', 75),
('Lactuca sativa', 'Lettuce, cool-season leafy green. Prefers consistent moisture and cool temperatures.', 70),
('Ocimum basilicum', 'Sweet basil, aromatic herb with broad leaves. Popular culinary herb requiring regular moisture.', 65),
('Petroselinum crispum', 'Curly parsley, biennial herb rich in vitamins. Prefers moist, well-drained soil.', 60),
('Capsicum annuum', 'Bell pepper, warm-season vegetable. Requires consistent moisture for proper fruit development.', 70),
('Brassica oleracea', 'Broccoli, cool-season vegetable with edible flower heads. Needs consistent moisture throughout growth.', 75),
('Daucus carota', 'Carrot, root vegetable requiring deep, loose soil. Consistent moisture prevents splitting.', 65),
('Allium cepa', 'Onion, bulb vegetable with layered structure. Moderate water needs, reducing before harvest.', 55),
('Cucumis sativus', 'Cucumber, vining vegetable with high water content. Requires abundant moisture for crisp fruits.', 80),
('Spinacia oleracea', 'Spinach, cool-season leafy green. Bolts quickly in heat, prefers consistent moisture.', 70),

-- Outdoor Flowering Plants
('Rosa rugosa', 'Beach rose, hardy shrub with fragrant flowers and edible hips. Salt tolerant and disease resistant.', 55),
('Helianthus annuus', 'Sunflower, tall annual with large yellow blooms. Deep taproot allows some drought tolerance.', 50),
('Tagetes patula', 'French marigold, compact annual with bright flowers. Natural pest deterrent in gardens.', 45),
('Petunia × atkinsiana', 'Garden petunia with trumpet-shaped flowers. Continuous bloomer requiring regular deadheading.', 60),
('Impatiens walleriana', 'Busy Lizzie, shade-loving annual with continuous blooms. Very sensitive to drought stress.', 75),
('Begonia × semperflorens', 'Wax begonia, compact annual with waxy leaves. Tolerates both sun and shade conditions.', 65),
('Zinnia elegans', 'Common zinnia, drought-tolerant annual with bright, long-lasting flowers. Heat loving.', 45),
('Cosmos bipinnatus', 'Garden cosmos, airy annual with delicate flowers. Drought tolerant once established.', 40),
('Calendula officinalis', 'Pot marigold, edible flowers with medicinal properties. Cool-season annual.', 50),
('Antirrhinum majus', 'Snapdragon, cool-season annual with spurred flowers. Prefers cool, moist conditions.', 65),

-- Trees & Shrubs
('Acer palmatum', 'Japanese maple, deciduous tree with delicate, palmate leaves. Prefers partial shade and consistent moisture.', 65),
('Rhododendron species', 'Azalea/rhododendron, evergreen shrubs with showy flowers. Prefer acidic, moist, well-drained soil.', 70),
('Hydrangea macrophylla', 'Bigleaf hydrangea with large flower clusters. Flower color changes with soil pH.', 75),
('Buxus sempervirens', 'Common boxwood, evergreen shrub used for hedging. Slow-growing and tolerates pruning.', 55),
('Juniperus communis', 'Common juniper, evergreen conifer with needle-like leaves. Very drought tolerant once established.', 35),
('Quercus robur', 'English oak, large deciduous tree with lobed leaves. Deep taproot makes it drought tolerant when mature.', 45),
('Fagus sylvatica', 'European beech, large deciduous tree with smooth bark. Shallow roots require consistent moisture.', 60),
('Picea abies', 'Norway spruce, tall evergreen conifer. Prefers cool, moist climates and acidic soil.', 65),
('Betula pendula', 'Silver birch, graceful deciduous tree with white bark. Relatively short-lived but fast-growing.', 60),
('Prunus serrulata', 'Japanese cherry, ornamental tree with spring blossoms. Prefers well-drained but moist soil.', 55),

-- Ferns & Shade Plants
('Nephrolepis exaltata', 'Boston fern with arching fronds. Popular houseplant requiring high humidity and consistent moisture.', 80),
('Adiantum capillus-veneris', 'Maidenhair fern with delicate, fan-shaped leaflets. Requires high humidity and filtered light.', 85),
('Pteris cretica', 'Cretan brake fern with distinctive frond patterns. More tolerant of drier conditions than most ferns.', 70),
('Hosta sieboldiana', 'Plantain lily with large, ribbed leaves. Shade perennial with fragrant white flowers.', 70),
('Astilbe chinensis', 'Chinese astilbe with feathery flower plumes. Shade perennial preferring moist, rich soil.', 75),
('Heuchera americana', 'Coral bells with colorful foliage and delicate flower spikes. Evergreen perennial for shade.', 60),
('Tiarella cordifolia', 'Foamflower, low-growing shade perennial with heart-shaped leaves and white flowers.', 70),
('Polystichum acrostichoides', 'Christmas fern, evergreen native fern tolerant of drier shade conditions.', 65),
('Athyrium filix-femina', 'Lady fern with lacy, bipinnate fronds. Deciduous fern preferring moist woodland conditions.', 75),
('Dryopteris marginalis', 'Marginal wood fern, evergreen native with blue-green fronds. Tolerates some drought when established.', 60),

-- Grasses & Ornamental Grasses
('Festuca glauca', 'Blue fescue, ornamental grass with blue-green tufts. Drought tolerant and low maintenance.', 35),
('Miscanthus sinensis', 'Maiden grass, tall ornamental grass with feathery plumes. Drought tolerant once established.', 40),
('Pennisetum alopecuroides', 'Fountain grass with arching foliage and bottlebrush flowers. Warm-season ornamental grass.', 45),
('Panicum virgatum', 'Switchgrass, native prairie grass with airy panicles. Extremely drought tolerant and wildlife friendly.', 30),
('Cortaderia selloana', 'Pampas grass, large ornamental grass with showy plumes. Very drought tolerant but can be invasive.', 25),
('Stipa tenuissima', 'Mexican feather grass with fine, flowing texture. Drought tolerant but short-lived.', 30),
('Lolium perenne', 'Perennial ryegrass, common lawn grass. Requires regular irrigation for dense, green turf.', 60),
('Zoysia japonica', 'Zoysia grass, warm-season lawn grass. Drought tolerant and forms dense, carpet-like turf.', 40),
('Bermuda grass hybrid', 'Hybrid bermuda grass, warm-season turf. Very drought tolerant and wear resistant.', 35),
('Poa pratensis', 'Kentucky bluegrass, cool-season lawn grass. Forms dense turf but requires regular irrigation.', 65),

-- Aquatic & Bog Plants
('Nymphaea alba', 'White water lily with floating leaves and fragrant flowers. Requires shallow, still water.', 95),
('Typha latifolia', 'Common cattail, emergent wetland plant. Tolerates variable water levels and poor water quality.', 90),
('Iris pseudacorus', 'Yellow flag iris, wetland perennial with sword-like leaves. Tolerates standing water.', 85),
('Pontederia cordata', 'Pickerel rush, aquatic perennial with blue flower spikes. Native wetland plant.', 95),
('Sagittaria latifolia', 'Arrowhead with distinctive arrow-shaped leaves. Emergent aquatic plant with white flowers.', 90),
('Acorus calamus', 'Sweet flag, grass-like wetland plant. Aromatic rhizomes used historically for flavoring.', 85),
('Caltha palustris', 'Marsh marigold with bright yellow flowers. Early spring bloomer in wet areas.', 80),
('Myriophyllum aquaticum', 'Parrot feather, submerged aquatic plant. Can be invasive in some regions.', 100),
('Eichhornia crassipes', 'Water hyacinth, floating aquatic plant. Beautiful but highly invasive.', 100),
('Nelumbo nucifera', 'Sacred lotus with large, circular leaves. Deep-rooted aquatic plant with symbolic significance.', 95),

-- Mediterranean & Drought-Tolerant Plants
('Lavandula angustifolia', 'English lavender with fragrant purple spikes. Drought tolerant herb with many uses.', 35),
('Rosmarinus officinalis', 'Rosemary, evergreen herb with needle-like leaves. Extremely drought tolerant culinary herb.', 30),
('Thymus vulgaris', 'Common thyme, low-growing aromatic herb. Very drought tolerant and deer resistant.', 25),
('Salvia officinalis', 'Garden sage with gray-green leaves. Drought tolerant culinary and medicinal herb.', 30),
('Santolina chamaecyparissus', 'Cotton lavender with silver foliage. Drought tolerant Mediterranean herb.', 25),
('Cistus ladanifer', 'Gum rockrose with sticky, aromatic leaves. Extremely drought tolerant shrub.', 20),
('Oleander species', 'Oleander, evergreen shrub with showy flowers. Highly drought tolerant but toxic.', 25),
('Olea europaea', 'Olive tree, ancient fruit tree with silver-green leaves. Extremely drought tolerant when established.', 30),
('Punica granatum', 'Pomegranate with bright red fruits. Drought tolerant tree with edible, antioxidant-rich fruits.', 35),
('Ficus carica', 'Common fig tree with lobed leaves. Drought tolerant fruit tree once established.', 40),

-- Tropical & Exotic Plants
('Strelitzia reginae', 'Bird of paradise with orange and blue flowers. Tropical plant requiring warm temperatures.', 65),
('Anthurium andraeanum', 'Flamingo flower with waxy, heart-shaped spathes. Tropical houseplant requiring high humidity.', 70),
('Calathea ornata', 'Pinstripe plant with patterned leaves. Prayer plant that folds leaves at night.', 75),
('Maranta leuconeura', 'Prayer plant with distinctive leaf markings. Tropical houseplant with interesting leaf movement.', 70),
('Alocasia amazonica', 'African mask plant with dramatic arrow-shaped leaves. Tropical plant requiring high humidity.', 75),
('Dieffenbachia seguine', 'Dumb cane with variegated leaves. Popular houseplant but toxic if ingested.', 65),
('Croton species', 'Croton with colorful, variegated foliage. Tropical shrub requiring bright light for color.', 60),
('Bromeliaceae family', 'Bromeliad species with rosette growth habit. Epiphytic plants with central water-holding cups.', 60),
('Bougainvillea spectabilis', 'Bougainvillea with colorful bracts. Thorny tropical vine requiring good drainage.', 45),
('Hibiscus rosa-sinensis', 'Chinese hibiscus with large, showy flowers. Tropical shrub blooming continuously in warm weather.', 65),

-- Fruit Trees & Edible Plants
('Malus domestica', 'Apple tree with spring blossoms and fall fruit. Requires cross-pollination and consistent moisture.', 65),
('Prunus persica', 'Peach tree with fuzzy fruits. Stone fruit requiring winter chill hours and summer heat.', 60),
('Citrus × limon', 'Lemon tree with fragrant flowers and acidic fruits. Evergreen citrus requiring protection from frost.', 55),
('Fragaria × ananassa', 'Garden strawberry with white flowers and red fruits. Perennial requiring consistent moisture.', 70),
('Rubus idaeus', 'Red raspberry with aggregate fruits. Cane fruit requiring support and regular pruning.', 65),
('Vaccinium corymbosum', 'Highbush blueberry with acidic fruit requirements. Prefers acidic, moist, well-drained soil.', 70),
('Vitis vinifera', 'Wine grape with climbing habit. Deep-rooted vine that becomes drought tolerant when established.', 45),
('Juglans regia', 'English walnut tree with compound leaves. Large tree requiring deep, well-drained soil.', 50),
('Castanea sativa', 'Sweet chestnut with edible nuts. Large tree preferring acidic, well-drained soil.', 55),
('Persea americana', 'Avocado tree with large, oil-rich fruits. Evergreen tree sensitive to cold and overwatering.', 50),

-- Native Wildflowers & Prairie Plants
('Echinacea purpurea', 'Purple coneflower, native prairie perennial. Drought tolerant with medicinal properties.', 40),
('Rudbeckia hirta', 'Black-eyed Susan with bright yellow flowers. Native annual/biennial tolerating poor soils.', 35),
('Monarda fistulosa', 'Wild bergamot with lavender flowers. Native herb attracting pollinators and hummingbirds.', 45),
('Asclepias speciosa', 'Showy milkweed, essential host plant for monarch butterflies. Deep-rooted prairie native.', 35),
('Solidago species', 'Goldenrod with yellow flower clusters. Often blamed for allergies but wind-pollinated ragweed is the culprit.', 40),
('Aster novae-angliae', 'New England aster with purple fall flowers. Important late-season nectar source for pollinators.', 50),
('Aquilegia canadensis', 'Wild columbine with red and yellow flowers. Native woodland perennial attracting hummingbirds.', 60),
('Geum triflorum', 'Prairie smoke with feathery seed heads. Native perennial with early spring flowers.', 40),
('Penstemon digitalis', 'Foxglove beardtongue with white flowers. Native perennial attracting long-tongued bees.', 45),
('Heliopsis helianthoides', 'Ox-eye sunflower, native perennial resembling black-eyed Susan. Long blooming period.', 45),

-- Vines & Climbing Plants
('Hedera helix', 'English ivy, evergreen climbing vine. Can be invasive but excellent for covering walls.', 55),
('Parthenocissus quinquefolia', 'Virginia creeper with five-leaflet compound leaves. Native vine with brilliant fall color.', 50),
('Clematis montana', 'Mountain clematis with masses of small white flowers. Vigorous climbing vine for pergolas.', 60),
('Lonicera periclymenum', 'Honeysuckle with fragrant tubular flowers. Climbing vine attracting moths and hummingbirds.', 55),
('Wisteria sinensis', 'Chinese wisteria with drooping purple flower clusters. Vigorous vine requiring strong support.', 60),
('Campsis radicans', 'Trumpet vine with orange trumpet flowers. Native vine attracting hummingbirds but can be aggressive.', 45),
('Ipomoea purpurea', 'Morning glory with funnel-shaped flowers. Annual vine opening in morning, closing in afternoon.', 55),
('Calystegia sepium', 'Hedge bindweed with white trumpet flowers. Perennial vine that can become weedy.', 60),
('Aristolochia macrophylla', 'Dutchman''s pipe with large, heart-shaped leaves. Native vine with unusual pipe-shaped flowers.', 65),
('Celastrus scandens', 'American bittersweet with orange berries. Native vine with decorative fall fruit clusters.', 50),

-- Air Plants & Epiphytes
('Tillandsia cyanea', 'Pink quill bromeliad with blue flowers. Epiphytic plant requiring humidity and air circulation.', 50),
('Tillandsia usneoides', 'Spanish moss, rootless epiphyte. Absorbs water and nutrients from air through specialized scales.', 40),
('Rhipsalis baccifera', 'Mistletoe cactus, epiphytic cactus with small white berries. Forest cactus preferring filtered light.', 55),
('Epiphyllum oxypetalum', 'Queen of the night, night-blooming cactus. Large, fragrant white flowers opening once per year.', 60),
('Schlumbergera bridgesi', 'Christmas cactus with segmented stems. Forest cactus blooming in response to day length.', 50),
('Platycerium bifurcatum', 'Staghorn fern with antler-shaped fronds. Epiphytic fern mounted on bark or in hanging baskets.', 70),
('Vriesea splendens', 'Flaming sword bromeliad with red flower spike. Epiphytic plant requiring high humidity.', 65),
('Guzmania lingulata', 'Scarlet star bromeliad with colorful bracts. Popular houseplant requiring filtered light.', 70),
('Aechmea fasciata', 'Silver vase plant with pink flower head. Tank bromeliad collecting water in leaf bases.', 60),
('Billbergia nutans', 'Queen''s tears with drooping flowers. Hardy bromeliad tolerating lower light conditions.', 55),

-- Bamboos & Ornamental Grasses
('Bambusa vulgaris', 'Common bamboo, clumping variety. Fast-growing ornamental and construction material.', 65),
('Phyllostachys aurea', 'Golden bamboo with yellowish culms. Running bamboo requiring containment to prevent spread.', 60),
('Fargesia murielae', 'Umbrella bamboo, non-invasive clumping variety. Cold-hardy bamboo suitable for temperate gardens.', 70),
('Pseudosasa japonica', 'Arrow bamboo with broad leaves. Running bamboo commonly used for screening.', 65),
('Sasa veitchii', 'Kuma bamboo grass with variegated leaves. Low-growing bamboo with distinctive white leaf edges.', 70),
('Carex morrowii', 'Japanese sedge grass with arching leaves. Evergreen ornamental grass for shade gardens.', 65),
('Hakonechloa macra', 'Japanese forest grass with cascading habit. Shade-loving ornamental grass with golden varieties.', 70),
('Imperata cylindrica', 'Japanese blood grass with red-tipped leaves. Ornamental grass requiring careful site selection.', 55),
('Calamagrostis × acutiflora', 'Feather reed grass with upright habit. Cool-season ornamental grass with persistent structure.', 50),
('Deschampsia cespitosa', 'Tufted hair grass with delicate flower heads. Cool-season grass tolerating wet conditions.', 65);