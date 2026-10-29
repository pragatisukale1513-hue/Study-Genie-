/**
 * High-Quality Sample Syllabi for Instant Testing and Demonstration
 */

export const SAMPLE_SYLLABI = [
  {
    id: 'sample_dsa',
    name: 'Computer Science: Data Structures & Algorithms',
    category: 'Computer Science',
    description: 'Covers Linear Data Structures, Trees, Graphs, Sorting & Searching, and Algorithm Analysis.',
    text: `Course Syllabus: Data Structures and Algorithms (CS201)

Unit 1: Linear Data Structures and Asymptotic Analysis
Chapter 1: Foundations of Complexity and Arrays
Topic 1.1: Asymptotic Notations and Big-O Analysis
Asymptotic notation is a mathematical tool used to describe the limiting behavior of an algorithm's execution time. Big-O notation is defined as the upper bound representation of an algorithm's worst-case time complexity. Omega notation represents the lower bound of an algorithm's execution time. Theta notation provides a tight bound representing both upper and lower limits. An algorithm with O(1) complexity runs in constant time regardless of input size. An algorithm with O(n) complexity exhibits linear growth directly proportional to the number of elements. Space complexity refers to the total amount of auxiliary memory required by an algorithm during execution.

Topic 1.2: Dynamic Arrays and Amortized Analysis
An array is defined as a contiguous collection of homogeneous elements accessible via numerical indices. Dynamic arrays automatically double their allocated memory capacity when the current storage limit is reached. The amortized insertion time for a dynamic array is O(1) despite individual resize operations requiring O(n) time. Random access in an array operates in O(1) constant time due to direct pointer arithmetic. Insertion or deletion at an arbitrary index in an array requires O(n) linear time because succeeding elements must be shifted.

Chapter 2: Stacks, Queues, and Linked Lists
Topic 2.1: Singly and Doubly Linked Lists
A linked list is a linear data structure where elements are stored in nodes connected by pointers. A singly linked list contains nodes having data and a reference to the next node. A doubly linked list contains nodes having references to both preceding and succeeding nodes. Insertion at the head of a linked list requires O(1) constant time. Searching for an element in an unsorted linked list requires O(n) linear time because sequential traversal is mandatory. Unlike contiguous arrays, linked lists do not require contiguous memory allocation.

Topic 2.2: Stacks and Queue Architectures
A stack is defined as a linear data structure operating under the Last-In First-Out (LIFO) protocol. The primary operations of a stack are push, pop, and peek, each running in O(1) time. Stacks are fundamental in function call execution, expression evaluation, and backtracking algorithms. A queue is a linear data structure operating under the First-In First-Out (FIFO) principle. In a standard queue, elements are enqueued at the rear and dequeued from the front. A priority queue is an abstract data type where each element has an associated priority determining its servicing order.

Unit 2: Hierarchical Structures and Graphs
Chapter 3: Trees and Binary Search Trees
Topic 3.1: Tree Terminology and Properties
A tree is defined as a hierarchical non-linear data structure consisting of nodes interconnected by directed or undirected edges. The root node is the topmost node of a tree with no parent. A leaf node is a terminal node that possesses zero children. The depth of a node is the number of edges from the root to that node. The height of a tree is the maximum length of a downward path from the root to a leaf.

Topic 3.2: Binary Search Trees and Balanced AVL Trees
A binary search tree is a binary tree where the key in each node is strictly greater than all keys in its left subtree and smaller than all keys in its right subtree. Inorder traversal of a binary search tree yields keys in sorted ascending order. In a balanced binary search tree, search, insertion, and deletion operations require O(log n) time. An AVL tree is a self-balancing binary search tree where heights of left and right subtrees of any node differ by at most one. If the balance factor exceeds the allowable threshold, tree rotations are performed to restore equilibrium.

Chapter 4: Graph Theory and Graph Traversals
Topic 4.1: Graph Representations and Connectivity
A graph is defined as a mathematical structure consisting of a finite set of vertices and a collection of edges connecting vertex pairs. An adjacency matrix is a two-dimensional array representing edges between vertices with O(1) edge lookup time. An adjacency list represents a graph as an array of linked lists, optimizing space complexity to O(V + E) for sparse graphs. A directed acyclic graph (DAG) is a directed graph containing no cycles.

Topic 4.2: Breadth-First and Depth-First Search
Breadth-First Search (BFS) is a graph traversal algorithm that explores neighbor vertices layer by layer using a FIFO queue. BFS is guaranteed to find the shortest path in unweighted graphs. Depth-First Search (DFS) is a graph traversal algorithm that explores as deep as possible along each branch before backtracking using a LIFO stack. Topological sorting is an ordering of vertices in a DAG such that for every directed edge (u, v), vertex u precedes vertex v. Dijkstra's algorithm computes single-source shortest paths in weighted graphs with non-negative edge weights.`
  },
  {
    id: 'sample_bio',
    name: 'Biology & Life Sciences: Cell Biology and Genetics',
    category: 'Life Sciences',
    description: 'Covers Cell Theory, Organelles, Mitosis, Meiosis, DNA Replication, and Mendelian Inheritance.',
    text: `Course Syllabus: Cellular Biology and Molecular Genetics (BIO101)

Unit 1: Cellular Architecture and Organelles
Chapter 1: Cell Theory and Cellular Classification
Topic 1.1: Foundational Cell Theory
Cell theory is defined as the foundational biological principle stating that all living organisms are composed of one or more cells. The cell is the most fundamental unit of structure and organizational function in living beings. All cells arise exclusively from pre-existing cells through cellular division. Unicellular organisms consist of a single independent cell capable of performing all life functions. Multicellular organisms organize specialized cells into tissues, organs, and organ systems.

Topic 1.2: Prokaryotes vs Eukaryotes
Prokaryotic cells are unicellular organisms lacking a membrane-bound nucleus and membrane-bound organelles. Bacterial cells and archaea represent the primary domains of prokaryotic life. Eukaryotic cells are complex cells possessing a true membrane-delimited nucleus housing genetic material. Eukaryotic cells contain specialized cytoplasmic organelles including mitochondria, chloroplasts, and the endoplasmic reticulum. The plasma membrane is a selectively permeable phospholipid bilayer regulating the transport of molecules into and out of the cell.

Chapter 2: Subcellular Organelles and Bioenergetics
Topic 2.1: Organelle Functions and Protein Synthesis
The nucleus functions as the administrative and genetic control center of eukaryotic cells. Mitochondria are double-membraned organelles known as the powerhouses of the cell because they synthesize ATP via cellular respiration. Chloroplasts are plant organelles containing chlorophyll responsible for photosynthetic sugar production. Ribosomes are cellular complexes composed of RNA and proteins that synthesize polypeptide chains during translation. The endoplasmic reticulum exists as rough endoplasmic reticulum studded with ribosomes and smooth endoplasmic reticulum specialized in lipid synthesis.

Topic 2.2: Cellular Transport Mechanisms
Passive transport refers to the movement of biochemical substances across cell membranes without requiring metabolic energy expenditure. Diffusion is the spontaneous movement of particles from an area of higher concentration to an area of lower concentration. Osmosis is defined as the passive diffusion of water molecules across a selectively permeable membrane. Active transport is the movement of ions or molecules across a cellular membrane against a concentration gradient requiring cellular energy in the form of ATP.

Unit 2: Molecular Genetics and Inheritance
Chapter 3: DNA Structure and Protein Expression
Topic 3.1: Double Helix Structure and Replication
Deoxyribonucleic acid (DNA) is a double-stranded helical polymer carrying hereditary genetic blueprints. Nucleotides are the molecular monomer units of nucleic acids consisting of a nitrogenous base, a pentose sugar, and a phosphate group. Adenine pairs exclusively with thymine via two hydrogen bonds, while guanine pairs with cytosine via three hydrogen bonds. DNA replication is semiconservative because each daughter molecule preserves one parental strand and synthesizes one newly formed complementary strand. DNA polymerase is the primary catalytic enzyme responsible for assembling new DNA nucleotides during replication.

Topic 3.2: Transcription and Translation Mechanisms
The central dogma of molecular biology describes the flow of sequence information from DNA to RNA to functional protein. Transcription is the biological process wherein genetic information encoded in DNA is transcribed into messenger RNA (mRNA). RNA polymerase is the primary enzyme responsible for catalyzing mRNA synthesis from the DNA template. Translation is the biochemical process wherein ribosomes synthesize specific polypeptide sequences guided by mRNA codons. Transfer RNA (tRNA) delivers matching amino acids to the ribosomal complex based on anticodon-codon complementarity.`
  },
  {
    id: 'sample_physics',
    name: 'Physics: Modern Physics and Quantum Fundamentals',
    category: 'Physics',
    description: 'Covers Photoelectric Effect, Wave-Particle Duality, Bohr Model, and Uncertainty Principle.',
    text: `Course Syllabus: Modern Physics and Quantum Foundations (PHYS301)

Unit 1: Quantum Foundations and Radiation
Chapter 1: The Quantum Nature of Light
Topic 1.1: Blackbody Radiation and Planck's Hypothesis
A blackbody is defined as an idealized physical body that absorbs all incident electromagnetic radiation without reflection. Classical Rayleigh-Jeans theory failed at high frequencies, an anomaly historically termed the ultraviolet catastrophe. Max Planck resolved this discrepancy by hypothesizing that energy is emitted or absorbed in discrete packets called quanta. The energy of an individual quantum is given by E = hf, where h is Planck's constant and f is radiation frequency. Planck's constant is an essential fundamental physical constant having a value of approximately 6.626 x 10^-34 Joule-seconds.

Topic 1.2: The Photoelectric Effect
The photoelectric effect is defined as the phenomenon wherein electrons are emitted from a material surface when illuminated by light of sufficient frequency. The threshold frequency is the minimum radiation frequency required to dislodge photoelectrons from a specific metal. The kinetic energy of emitted photoelectrons is independent of light intensity and depends solely on the frequency of incident radiation. Increasing light intensity increases the rate of electron emission but does not increase individual electron kinetic energy. Albert Einstein explained the photoelectric effect by proposing that light consists of localized corpuscular packets of energy termed photons.

Chapter 2: Matter Waves and Quantum Mechanics
Topic 2.1: De Broglie Wavelength and Wave-Particle Duality
Wave-particle duality is the physical concept that all matter and light exhibit both particulate and wave-like characteristics. Louis de Broglie hypothesized that any moving particle with momentum p possesses an associated matter wavelength given by lambda = h / p. The wave nature of electrons was empirically confirmed by the Davisson-Germer electron diffraction experiment. Macroscopic objects possess negligible wavelengths because their substantial mass renders de Broglie wavelengths undetectable.

Topic 2.2: Heisenberg Uncertainty Principle and Wave Functions
The Heisenberg uncertainty principle states that it is impossible to simultaneously measure both the exact position and momentum of a particle with unlimited precision. The mathematical expression of the uncertainty principle is Delta x times Delta p is greater than or equal to h-bar divided by two. The uncertainty principle is not a flaw in measurement instruments but an intrinsic physical limitation of quantum mechanical wave systems. The wave function, denoted by psi, contains all knowable physical information regarding a quantum particle. Max Born interpreted the square of the absolute wave function as the probability density of locating the particle at a specific coordinate.`
  }
];
